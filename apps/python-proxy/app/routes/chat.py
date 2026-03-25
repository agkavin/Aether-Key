import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import litellm
from litellm.exceptions import AuthenticationError, RateLimitError, BadRequestError

router = APIRouter()

litellm.telemetry = False


def _extract_credentials(request: Request, provider_id: str) -> dict:
    """Extract litellm-compatible credentials from request headers."""
    creds: dict = {}

    # Standard API key
    api_key = request.headers.get("x-api-key")
    if api_key:
        creds["api_key"] = api_key

    # Azure-specific
    azure_api_key = request.headers.get("x-azure-api-key")
    azure_api_base = request.headers.get("x-azure-api-base")
    azure_api_version = request.headers.get("x-azure-api-version")
    if azure_api_key:
        creds["api_key"] = azure_api_key
    if azure_api_base:
        creds["api_base"] = azure_api_base
    if azure_api_version:
        creds["api_version"] = azure_api_version

    # Databricks
    databricks_api_base = request.headers.get("x-databricks-api-base")
    if databricks_api_base:
        creds["api_base"] = databricks_api_base

    # AWS Bedrock
    aws_access_key = request.headers.get("x-aws-access-key-id")
    aws_secret_key = request.headers.get("x-aws-secret-access-key")
    aws_region = request.headers.get("x-aws-region-name")
    if aws_access_key:
        creds["aws_access_key_id"] = aws_access_key
    if aws_secret_key:
        creds["aws_secret_access_key"] = aws_secret_key
    if aws_region:
        creds["aws_region_name"] = aws_region

    return creds


@router.post("/chat/completions")
async def chat_completions(request: Request):
    """
    Universal gateway for chat completions.
    Accepts standard OpenAI-format body and routes via LiteLLM.
    The model string from the client should be the litellm model ID
    (e.g. "gpt-4o", "groq/llama-3.3-70b-versatile", "claude-3-5-sonnet-20241022").
    """
    provider_id = request.headers.get("x-provider")
    if not provider_id:
        raise HTTPException(status_code=400, detail="Missing X-Provider header")

    # Parse body
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    model = body.get("model")
    messages = body.get("messages")
    stream = body.get("stream", False)

    if not model or not messages:
        raise HTTPException(status_code=400, detail="Missing 'model' or 'messages' in body")

    creds = _extract_credentials(request, provider_id)

    # Build litellm args
    litellm_args: dict = {
        "model": model,
        "messages": messages,
        "stream": stream,
    }
    litellm_args.update(creds)

    # Pass optional generation params
    for key in ["temperature", "max_tokens", "top_p", "frequency_penalty", "presence_penalty", "stop", "seed"]:
        if key in body:
            litellm_args[key] = body[key]

    try:
        if stream:
            return StreamingResponse(
                _stream_response(litellm_args),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                },
            )
        else:
            response = await litellm.acompletion(**litellm_args)
            return response.model_dump()

    except AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid API key.")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
    except BadRequestError as e:
        raise HTTPException(status_code=400, detail=f"Bad request: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _stream_response(litellm_args: dict):
    """Generator that yields SSE-formatted chunks from LiteLLM."""
    try:
        response = await litellm.acompletion(**litellm_args)
        async for chunk in response:
            chunk_dict = chunk.model_dump()
            yield f"data: {json.dumps(chunk_dict)}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        error_payload = {"error": {"message": str(e), "type": "stream_error"}}
        yield f"data: {json.dumps(error_payload)}\n\n"
        yield "data: [DONE]\n\n"
