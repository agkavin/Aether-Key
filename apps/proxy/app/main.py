from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .middleware.redact_logs import RedactSensitiveHeadersMiddleware, install_log_redactor
from .config import settings

app = FastAPI(title="Aether-Key Universal BYOK Gateway")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redact sensitive headers from logs
app.add_middleware(RedactSensitiveHeadersMiddleware)
install_log_redactor()


@app.get("/")
async def root():
    return {"status": "Aether-Key Proxy is running."}


# Routers
from .routes.health import router as health_router
from .routes.metadata import router as metadata_router
from .routes.validate import router as validate_router
from .routes.chat import router as chat_router

app.include_router(health_router, prefix="/v1")
app.include_router(metadata_router, prefix="/v1")
app.include_router(validate_router, prefix="/v1")
app.include_router(chat_router, prefix="/v1")
