from fastapi import APIRouter, HTTPException, Query
from ..services.provider_registry import get_all_providers, get_provider
from ..services.ollama_service import discover_models, validate_connection

router = APIRouter()


@router.get("/metadata")
async def get_metadata():
    """Returns the list of supported cloud providers and their models."""
    providers = get_all_providers()
    clean_providers = []
    for p in providers:
        clean_providers.append({
            "id": p["id"],
            "name": p["name"],
            "models": p["models"],
        })
    return {"providers": clean_providers}


@router.get("/metadata/{provider_id}/fields")
async def get_provider_fields(provider_id: str):
    """Returns the required credential fields for a specific provider."""
    # Ollama doesn't need credentials
    if provider_id == "ollama":
        return {"required_params": []}

    provider = get_provider(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return {"required_params": provider["required_params"]}


@router.get("/ollama/models")
async def get_ollama_models(
    host: str = Query(default="http://localhost:11434", description="Ollama host URL"),
):
    """
    Discover locally available Ollama models with real metadata.
    Uses the native ollama library for accurate context windows, model sizes, etc.
    """
    models = await discover_models(host)
    return {"models": models}


@router.get("/ollama/status")
async def get_ollama_status(
    host: str = Query(default="http://localhost:11434", description="Ollama host URL"),
):
    """Check if Ollama is reachable and return info."""
    result = await validate_connection(host)
    return result
