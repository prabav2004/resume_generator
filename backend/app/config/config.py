from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import (
    AliasChoices,
    AnyHttpUrl,
    Field,
    SecretStr,
    field_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


# ============================================================
# Project paths
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]
BACKEND_ROOT = Path(__file__).resolve().parents[2]


# Load environment variables
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(BACKEND_ROOT / ".env", override=False)


# ============================================================
# Application Settings
# ============================================================

class Settings(BaseSettings):

    # --------------------------------------------------------
    # Application
    # --------------------------------------------------------

    app_name: str = "AI Resume Analyzer & Career Advisor"
    app_version: str = "0.1.0"

    environment: Literal[
        "local",
        "development",
        "staging",
        "production",
    ] = "local"

    debug: bool = False
    enable_docs: bool = True


    # --------------------------------------------------------
    # API
    # --------------------------------------------------------

    api_v1_prefix: str = "/api/v1"

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173"
        ]
    )

    frontend_url: AnyHttpUrl | None = None


    # --------------------------------------------------------
    # File uploads
    # --------------------------------------------------------

    temp_upload_dir: Path = (
        PROJECT_ROOT / "tmp" / "uploads"
    )

    max_resume_upload_bytes: int = (
        10 * 1024 * 1024
    )


    # --------------------------------------------------------
    # Database
    # --------------------------------------------------------

    database_url: str = Field(
        default=(
            "postgresql+psycopg://"
            "postgres:postgres@localhost:5432/"
            "resume_generator"
        ),
        validation_alias="DATABASE_URL",
    )


    # --------------------------------------------------------
    # Logging
    # --------------------------------------------------------

    log_level: Literal[
        "DEBUG",
        "INFO",
        "WARNING",
        "ERROR",
        "CRITICAL",
    ] = "INFO"


    # ========================================================
    # AI PROVIDERS
    # ========================================================

    # --------------------------------------------------------
    # OpenAI — Primary provider
    # --------------------------------------------------------

    openai_api_key: SecretStr = Field(
        validation_alias="OPENAI_API_KEY"
    )

    openai_model: str = Field(
        default="gpt-4o-mini",
        validation_alias="OPENAI_MODEL",
    )


    # --------------------------------------------------------
    # Groq — Fallback provider
    # --------------------------------------------------------

    groq_api_key: SecretStr = Field(
        validation_alias="GROQ_API_KEY"
    )

    groq_base_url: str = Field(
        default="https://api.groq.com/openai/v1",
        validation_alias="GROQ_BASE_URL",
    )

    groq_model: str = Field(
        default="llama-3.3-70b-versatile",
        validation_alias="GROQ_MODEL",
    )

    llm_primary_provider: Literal["openai", "groq"] = Field(
        default="openai",
        validation_alias="LLM_PRIMARY_PROVIDER",
    )


    # --------------------------------------------------------
    # LangSmith
    # --------------------------------------------------------

    langsmith_api_key: SecretStr = Field(
        validation_alias="LANGSMITH_API_KEY"
    )

    langsmith_tracing: bool = Field(
        validation_alias="LANGSMITH_TRACING"
    )

    langsmith_project: str = Field(
        min_length=1,
        validation_alias="LANGSMITH_PROJECT",
    )


    # --------------------------------------------------------
    # Hugging Face
    # --------------------------------------------------------

    huggingfacehub_api_token: SecretStr = Field(
        validation_alias=AliasChoices(
            "HUGGINGFACEHUB_API_TOKEN",
            "HUGGINGFACE_API_TOKEN",
        )
    )

    model_provider: str = "huggingface"

    hf_skill_model: str = (
        "facebook/bart-large-mnli"
    )


    # ========================================================
    # Pydantic Settings Configuration
    # ========================================================

    model_config = SettingsConfigDict(
        env_file=(
            PROJECT_ROOT / ".env",
            BACKEND_ROOT / ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


    # ========================================================
    # Validators
    # ========================================================

    # --------------------------------------------------------
    # CORS parser
    # --------------------------------------------------------

    @field_validator(
        "cors_origins",
        mode="before",
    )
    @classmethod
    def parse_cors_origins(
        cls,
        value: str | list[str],
    ) -> list[str]:

        if isinstance(value, str):
            return [
                origin.strip()
                for origin in value.split(",")
                if origin.strip()
            ]

        return value


    # --------------------------------------------------------
    # Database URL normalizer
    # --------------------------------------------------------

    @field_validator(
        "database_url",
        mode="before",
    )
    @classmethod
    def normalize_database_url(
        cls,
        value: str,
    ) -> str:

        if value.startswith("postgres://"):
            return value.replace(
                "postgres://",
                "postgresql+psycopg://",
                1,
            )

        if value.startswith("postgresql://"):
            return value.replace(
                "postgresql://",
                "postgresql+psycopg://",
                1,
            )

        return value


    # --------------------------------------------------------
    # Secret validation
    # --------------------------------------------------------

    @field_validator(
        "openai_api_key",
        "groq_api_key",
        "langsmith_api_key",
        "huggingfacehub_api_token",
    )
    @classmethod
    def validate_secret(
        cls,
        value: SecretStr,
    ) -> SecretStr:

        secret = (
            value
            .get_secret_value()
            .strip()
        )

        if not secret:
            raise ValueError(
                "Required API key is missing."
            )

        if secret.lower().startswith(
            (
                "your_",
                "replace_",
                "changeme",
            )
        ):
            raise ValueError(
                "Required API key must not "
                "use a placeholder value."
            )

        return value


    # --------------------------------------------------------
    # LangSmith validation
    # --------------------------------------------------------

    @field_validator("langsmith_tracing")
    @classmethod
    def require_langsmith_tracing(
        cls,
        value: bool,
    ) -> bool:

        if value is not True:
            raise ValueError(
                "LANGSMITH_TRACING must be true."
            )

        return value


# ============================================================
# Cached settings
# ============================================================

@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
