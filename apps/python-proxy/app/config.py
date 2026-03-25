import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    ALLOWED_PROVIDERS: str = os.getenv("ALLOWED_PROVIDERS", "")


settings = Settings()
