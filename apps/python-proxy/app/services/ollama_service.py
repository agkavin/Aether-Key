"""
Ollama discovery service using the native ollama library.
Provides live model discovery with real metadata (context window, size, quantization).
"""
import ollama
from typing import Any


def _build_client(host: str = "http://localhost:11434") -> ollama.AsyncClient:
    return ollama.AsyncClient(host=host)


def _extract_context_window(modelinfo: dict) -> int | None:
    """Extract context window from modelinfo dict (architecture-agnostic)."""
    for key, value in modelinfo.items():
        if key.endswith(".context_length") and isinstance(value, int):
            return value
    return None


def _extract_capabilities(show_resp) -> list[str]:
    """Extract model capabilities (completion, tools, vision, etc.)."""
    caps = getattr(show_resp, "capabilities", None)
    if caps and isinstance(caps, list):
        return list(caps)
    return []


async def discover_models(host: str = "http://localhost:11434") -> list[dict[str, Any]]:
    """
    Discover all locally available Ollama models with rich metadata from
    the model's actual GGUF file — not a lookup table.

    Returns a list of dicts with:
      - id: model name (e.g. "llama3.1:8b")
      - name: display name
      - context_window: actual context length from the model file
      - parameter_size: e.g. "8.0B"
      - quantization: e.g. "Q4_0"
      - size_bytes: model file size
      - family: model family (llama, qwen, gemma, etc.)
      - capabilities: list of capabilities (completion, tools, vision)
    """
    client = _build_client(host)
    try:
        tags = await client.list()
    except Exception:
        return []

    models = []
    for model in tags.models:
        model_name = model.model or ""
        if not model_name:
            continue

        info: dict[str, Any] = {
            "id": model_name,
            "name": model_name,
        }

        # Extract from list response
        details = model.details or None
        if details:
            if hasattr(details, "parameter_size") and details.parameter_size:
                info["parameter_size"] = details.parameter_size
            if hasattr(details, "quantization_level") and details.quantization_level:
                info["quantization"] = details.quantization_level
            if hasattr(details, "family") and details.family:
                info["family"] = details.family

        if model.size:
            info["size_bytes"] = model.size
            size_gb = model.size / (1024 ** 3)
            info["size_display"] = f"{size_gb:.1f} GB"

        # Enrich with show() — gives us real model metadata
        try:
            show_resp = await client.show(info["id"])

            # Context window from modelinfo
            modelinfo = show_resp.modelinfo or {}
            ctx = _extract_context_window(modelinfo)
            if ctx:
                info["context_window"] = ctx

            # Capabilities
            caps = _extract_capabilities(show_resp)
            if caps:
                info["capabilities"] = caps

            # Architecture from modelinfo
            for key in modelinfo:
                if key.endswith(".architecture"):
                    info["architecture"] = modelinfo[key]
                    break

        except Exception:
            pass

        models.append(info)

    return models


async def validate_connection(host: str = "http://localhost:11434") -> dict[str, Any]:
    """Check if Ollama is reachable and return basic info."""
    client = _build_client(host)
    try:
        tags = await client.list()
        model_names = [m.model for m in tags.models if m.model]
        return {
            "status": "ok",
            "model_count": len(model_names),
            "models": model_names,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }
