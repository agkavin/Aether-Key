import litellm
from typing import Any

litellm.telemetry = False

# Human-readable names for providers
PROVIDER_DISPLAY_NAMES: dict[str, str] = {
    "openai": "OpenAI",
    "anthropic": "Anthropic",
    "gemini": "Google Gemini",
    "groq": "Groq",
    "azure": "Azure OpenAI",
    "mistral": "Mistral AI",
    "cohere_chat": "Cohere",
    "deepseek": "DeepSeek",
    "xai": "xAI (Grok)",
    "cerebras": "Cerebras",
    "together_ai": "Together AI",
    "deepinfra": "DeepInfra",
    "perplexity": "Perplexity",
    "fireworks_ai": "Fireworks AI",
    "databricks": "Databricks",
    "openrouter": "OpenRouter",
    "replicate": "Replicate",
    "huggingface": "HuggingFace",
    "ollama": "Ollama",
    "ollama_chat": "Ollama",
    "sambanova": "SambaNova",
    "novita": "Novita AI",
    "codestral": "Codestral (Mistral)",
    "cloudflare": "Cloudflare Workers AI",
    "nvidia_nim": "NVIDIA NIM",
    "friendliai": "FriendliAI",
    "volcengine": "Volcano Engine",
    "moonshot": "Moonshot AI",
    "zai": "Z.AI (Zhipu)",
    "ai21": "AI21 Labs",
    "watsonx": "IBM watsonx",
    "bedrock": "AWS Bedrock",
    "bedrock_converse": "AWS Bedrock Converse",
    "vertex_ai": "Google Vertex AI",
    "azure_ai": "Azure AI",
    "aiml": "AI/ML API",
    "nscale": "Nscale",
    "github_copilot": "GitHub Copilot",
    "lambda_ai": "Lambda AI",
    "hyperbolic": "Hyperbolic",
    "snowflake": "Snowflake",
    "dashscope": "Dashscope (Alibaba)",
    "oci": "Oracle Cloud (OCI)",
    "minimax": "MiniMax",
}

# Map litellm provider -> required API key param name(s)
# These are the env vars / param names that litellm expects
PROVIDER_REQUIRED_KEYS: dict[str, list[str]] = {
    "openai": ["OPENAI_API_KEY"],
    "anthropic": ["ANTHROPIC_API_KEY"],
    "gemini": ["GEMINI_API_KEY"],
    "groq": ["GROQ_API_KEY"],
    "azure": ["AZURE_API_KEY", "AZURE_API_BASE", "AZURE_API_VERSION"],
    "mistral": ["MISTRAL_API_KEY"],
    "cohere_chat": ["COHERE_API_KEY"],
    "deepseek": ["DEEPSEEK_API_KEY"],
    "xai": ["XAI_API_KEY"],
    "cerebras": ["CEREBRAS_API_KEY"],
    "together_ai": ["TOGETHERAI_API_KEY"],
    "deepinfra": ["DEEPINFRA_API_KEY"],
    "perplexity": ["PERPLEXITY_API_KEY"],
    "fireworks_ai": ["FIREWORKS_AI_API_KEY"],
    "databricks": ["DATABRICKS_API_KEY", "DATABRICKS_API_BASE"],
    "openrouter": ["OPENROUTER_API_KEY"],
    "replicate": ["REPLICATE_API_KEY"],
    "huggingface": ["HUGGINGFACE_API_KEY"],
    "sambanova": ["SAMBANOVA_API_KEY"],
    "novita": ["NOVITA_API_KEY"],
    "codestral": ["CODESTRAL_API_KEY"],
    "cloudflare": ["CLOUDFLARE_API_KEY", "CLOUDFLARE_ACCOUNT_ID"],
    "nvidia_nim": ["NVIDIA_NIM_API_KEY"],
    "friendliai": ["FRIENDLI_API_KEY"],
    "volcengine": ["VOLCENGINE_API_KEY"],
    "moonshot": ["MOONSHOT_API_KEY"],
    "zai": ["ZAI_API_KEY"],
    "ai21": ["AI21_API_KEY"],
    "watsonx": ["WX_API_KEY", "WX_PROJECT_ID"],
    "bedrock": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION_NAME"],
    "bedrock_converse": ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION_NAME"],
    "vertex_ai": ["GOOGLE_APPLICATION_CREDENTIALS"],
    "azure_ai": ["AZURE_AI_API_KEY", "AZURE_AI_API_BASE"],
    "aiml": ["AIML_API_KEY"],
    "nscale": ["NSCALE_API_KEY"],
    "github_copilot": [],  # uses device auth
    "lambda_ai": ["LAMBDA_AI_API_KEY"],
    "hyperbolic": ["HYPERBOLIC_API_KEY"],
    "snowflake": ["SNOWFLAKE_API_KEY"],
    "dashscope": ["DASHSCOPE_API_KEY"],
    "oci": ["OCI_COMPARTMENT_ID"],
    "minimax": ["MINIMAX_API_KEY"],
}

# Providers we skip (not chat completion providers)
SKIP_PROVIDERS = {
    "custom_openai", "custom", "text-completion-openai", "text-completion-codestral",
    "hosted_vllm", "aiohttp_openai", "langfuse", "humanloop",
    "palm", "oobabooga", "petals", "milvus", "pg_vector", "s3_vectors",
    "triton", "assemblyai", "deepgram", "elevenlabs", "topaz",
    "stability", "black_forest_labs", "fal_ai", "recraft", "runwayml",
    "aws_polly", "aiml", "openai_like", "a2a", "a2a_agent",
    "gigachat", "empower", "ragflow", "compactifai", "docker_model_runner",
    "llamafile", "lm_studio", "galadriel", "nebius", "infinity",
    "jina_ai", "voyage", "datarobot", "maritalk", "featherless_ai",
    "publicai", "morph", "v0", "vercel_ai_gateway", "dotprompt",
    "manus", "wandb", "ovhcloud", "lemonade", "clarifai", "heroku",
    "cometapi", "helicone", "sap", "github", "github_copilot",
    "anyscale", "bedrock_mantle", "llamagate", "meta_llama",
    "gradient_ai", "chatgpt", "xai", "xai", "xai", "xai", "xai",
    "chutes", "xiaomi_mimo", "litellm_agent", "cursor", "synthetic",
    "apertis", "nano-gpt", "poe", "aiml", "aiml", "aiml", "aiml",
}


def _build_provider_entry(provider_id: str) -> dict[str, Any] | None:
    """Build a provider entry from litellm's data."""
    model_ids = litellm.models_by_provider.get(provider_id, set())
    if not model_ids:
        return None

    cost_map = litellm.model_cost
    models = []
    first_chat_model = None

    for model_id in sorted(model_ids, reverse=True):
        # Look up metadata from cost map
        meta = cost_map.get(model_id, {})
        mode = meta.get("mode", "chat")

        # Skip non-chat models (embedding, image, audio, etc.)
        if mode != "chat":
            continue

        context_window = meta.get("max_input_tokens") or meta.get("max_tokens")

        # Build a display name from the model ID
        # Strip provider prefix if present (e.g. "groq/llama3" -> "llama3")
        display_name = model_id
        if "/" in display_name:
            display_name = display_name.split("/", 1)[-1]
        # Clean up the display name
        display_name = display_name.replace("-", " ").replace("_", " ").title()

        model_entry: dict[str, Any] = {
            "id": model_id,
            "name": display_name,
        }
        if context_window:
            model_entry["context_window"] = context_window

        models.append(model_entry)
        if first_chat_model is None:
            first_chat_model = model_id

    if not models:
        return None

    display_name = PROVIDER_DISPLAY_NAMES.get(
        provider_id,
        provider_id.replace("_", " ").replace("-", " ").title()
    )
    required_keys = PROVIDER_REQUIRED_KEYS.get(provider_id, [f"{provider_id.upper()}_API_KEY"])

    return {
        "id": provider_id,
        "name": display_name,
        "models": models,
        "required_params": required_keys,
        "validation_model": first_chat_model,
    }


def _discover_providers() -> list[dict[str, Any]]:
    """Dynamically discover all chat-capable providers from litellm."""
    providers = []
    for provider in litellm.provider_list:
        # provider can be an LlmProviders enum or a string
        provider_id = provider.value if hasattr(provider, "value") else str(provider)
        if provider_id in SKIP_PROVIDERS:
            continue
        entry = _build_provider_entry(provider_id)
        if entry:
            providers.append(entry)

    # Sort alphabetically, but keep top providers at top
    TOP_PROVIDERS = {"openai", "anthropic", "gemini", "groq", "azure", "mistral", "ollama", "ollama_chat"}
    top = [p for p in providers if p["id"] in TOP_PROVIDERS]
    rest = [p for p in providers if p["id"] not in TOP_PROVIDERS]
    top.sort(key=lambda p: p["name"])
    rest.sort(key=lambda p: p["name"])

    # Deduplicate overlapping providers
    DEDUP_MAP = {
        "ollama_chat": "ollama",   # merge ollama_chat into ollama
        "cohere_chat": "cohere",   # merge cohere_chat into cohere
        "bedrock_converse": "bedrock",  # merge bedrock_converse into bedrock
    }
    seen_ids = set()
    result = []
    for p in top + rest:
        canonical_id = DEDUP_MAP.get(p["id"], p["id"])
        if canonical_id in seen_ids:
            continue
        # If we're keeping the canonical version, update the entry
        if canonical_id != p["id"]:
            p["id"] = canonical_id
        seen_ids.add(canonical_id)
        result.append(p)

    return result


# Cache the discovered providers at import time
_providers_cache: list[dict[str, Any]] | None = None


def get_all_providers() -> list[dict[str, Any]]:
    global _providers_cache
    if _providers_cache is None:
        _providers_cache = _discover_providers()
    return _providers_cache


def refresh_providers() -> list[dict[str, Any]]:
    """Force re-discovery of providers (e.g. after litellm update)."""
    global _providers_cache
    _providers_cache = None
    _providers_cache = _discover_providers()
    return _providers_cache


def get_provider(provider_id: str) -> dict[str, Any] | None:
    for p in get_all_providers():
        if p["id"] == provider_id:
            return p
    return None


def get_provider_fields(provider_id: str) -> list[str] | None:
    provider = get_provider(provider_id)
    if provider:
        return provider["required_params"]
    # Fallback for unknown providers
    return PROVIDER_REQUIRED_KEYS.get(provider_id)
