from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    db_host: str = "10.20.100.8"
    db_port: int = 5432
    db_user: str = "admin"
    db_password: str = ""
    db_name: str = "nuevo_siexud"

    # JWT
    secret_key: str = "cambiar_por_clave_segura"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
