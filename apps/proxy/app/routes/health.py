from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    """Returns 200 OK if the proxy is running."""
    return {"status": "ok", "service": "aether-key-proxy"}
