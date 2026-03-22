from fastapi import APIRouter, Request, HTTPException
import litellm
from litellm.exceptions import AuthenticationError, BadRequestError
from ..services.provider_registry import get_provider

router = APIRouter()

litellm.telemetry = False


def _extract_credentials(request: Request, provider_id: str) -> dict:
    """Extract litellm-compatible credentials from request headers."""
    creds: dict = {}

    api_key = request.headers.get("x-api-key")
    if api_key:
        creds["api_key"] = api_key

    azure_api_key = request.headers.get("x-azure-api-key")
    azure_api_base = request.headers.get("x-azure-api-base")
    azure_api_version = request.headers.get("x-azure-api-version")
    if azure_api_key:
        creds["api_key"] = azure_api_key
    if azure_api_base:
        creds["api_base"] = azure_api_base
    if azure_api_version:
        creds["api_version"] = azure_api_version

    databricks_api_base = request.headers.get("x-databricks-api-base")
    if databricks_api_base:
        creds["api_base"] = databricks_api_base

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


@router.post("/validate")
async def validate_key(request: Request):
    """
    Performs a minimal 1-token dry-run to validate the API key.
    Tries multiple models per provider in case some are decommissioned.
    """
    provider_id = request.headers.get("x-provider")
    if not provider_id:
        raise HTTPException(status_code=400, detail="Missing X-Provider header")

    provider = get_provider(provider_id)
    if not provider:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider_id}")

    # Get all candidate models for this provider, not just the first one
    models = [m["id"] for m in provider.get("models", [])]
    if not models:
        raise HTTPException(status_code=400, detail=f"No models available for provider: {provider_id}")

    creds = _extract_credentials(request, provider_id)

    last_error = None

    for model in models[:5]:  # Try up to 5 models
        litellm_args: dict = {
            "model": model,
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 1,
        }
        litellm_args.update(creds)

        try:
            await litellm.acompletion(**litellm_args)
            return {
                "status": "ok",
                "provider": provider_id,
                "model": model,
            }
        except AuthenticationError:
            # Auth error means the key is wrong — no point trying other models
            raise HTTPException(status_code=401, detail="Invalid API key provided.")
        except BadRequestError as e:
            error_str = str(e).lower()
            # If the model is decommissioned/unavailable, try the next one
            # Be careful NOT to match "Invalid API Key" — that's an auth error
            if any(kw in error_str for kw in ["decommission", "not found", "invalid_model", "not available", "does not exist", "no such model"]):
                last_error = e
                continue
            # "Invalid API Key" or similar — key is wrong
            if "invalid" in error_str and "key" in error_str:
                raise HTTPException(status_code=401, detail="Invalid API key provided.")
            # Other bad request — fail immediately
            raise HTTPException(status_code=400, detail=f"Bad request: {str(e)}")
        except Exception as e:
            last_error = e
            continue

    # All models failed
    raise HTTPException(
        status_code=400,
        detail=f"All validation models failed. Last error: {last_error}"
    )
