import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Cliente de test de FastAPI."""
    with TestClient(app) as c:
        yield c
