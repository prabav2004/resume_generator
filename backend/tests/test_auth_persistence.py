from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.config.config import Settings
from app.database import Base, get_db
from app.main import create_app
from app.models.auth import User


def _client_for_database(database_url: str) -> TestClient:
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


def test_user_and_history_survive_app_recreation(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'auth.db'}"
    first_client = _client_for_database(database_url)

    register_response = first_client.post(
        "/api/v1/auth/register",
        json={"username": "persisted", "email": "persisted@example.com", "password": "secret123"},
    )
    assert register_response.status_code == 201
    token = register_response.json()["access_token"]

    history_response = first_client.post(
        "/api/v1/auth/history",
        json={"filename": "resume.pdf", "status": "completed", "target_role": "Backend Engineer"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert history_response.status_code == 201

    second_client = _client_for_database(database_url)

    me_response = second_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["username"] == "persisted"

    persisted_history_response = second_client.get("/api/v1/auth/history", headers={"Authorization": f"Bearer {token}"})
    assert persisted_history_response.status_code == 200
    history_data = persisted_history_response.json()
    assert history_data == [
        {
            "id": history_data[0]["id"],
            "filename": "resume.pdf",
            "status": "completed",
            "target_role": "Backend Engineer",
            "created_at": history_data[0]["created_at"],
        }
    ]


def test_password_is_stored_hashed(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'auth.db'}"
    client = _client_for_database(database_url)

    response = client.post(
        "/api/v1/auth/register",
        json={"username": "hashed", "email": "hashed@example.com", "password": "secret123"},
    )
    assert response.status_code == 201

    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    session_local = sessionmaker(bind=engine)
    with session_local() as db:
        user = db.scalar(select(User).where(User.username == "hashed"))

    assert user is not None
    assert user.hashed_password != "secret123"
    assert "$" in user.hashed_password


def test_railway_postgres_url_is_normalized():
    settings = Settings(
        OPENAI_API_KEY="test_openai_key",
        LANGSMITH_API_KEY="test_langsmith_key",
        LANGSMITH_TRACING=True,
        LANGSMITH_PROJECT="resume-generator-test",
        HUGGINGFACEHUB_API_TOKEN="test_huggingface_token",
        DATABASE_URL="postgres://user:password@host:5432/railway",
    )

    assert settings.database_url == "postgresql+psycopg://user:password@host:5432/railway"
