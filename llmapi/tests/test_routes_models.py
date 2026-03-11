"""Tests para la ruta /models usando TestClient de FastAPI."""
import pytest
from unittest.mock import patch


# ─── GET /models/ ─────────────────────────────────────────────────────────────

class TestGetModels:
    def test_devuelve_lista_de_modelos(self, client):
        models_data = {"models": [{"name": "llama3:8b"}, {"name": "llava:13b"}]}
        with patch("app.routes.models.list_models", return_value=models_data):
            resp = client.get("/models/")

        assert resp.status_code == 200
        assert resp.json() == models_data

    def test_devuelve_503_cuando_ollama_no_disponible(self, client):
        with patch(
            "app.routes.models.list_models",
            return_value={"error": "No se pudo conectar con Ollama"},
        ):
            resp = client.get("/models/")

        assert resp.status_code == 503

    def test_devuelve_500_en_excepcion_inesperada(self, client):
        with patch("app.routes.models.list_models", side_effect=RuntimeError("crash")):
            resp = client.get("/models/")

        assert resp.status_code == 500


# ─── GET /models/auto-select ──────────────────────────────────────────────────

class TestGetAutoSelectedModels:
    def test_devuelve_modelos_auto_seleccionados(self, client):
        selected = {"vision_model": "llava:13b", "coding_model": "qwen2.5-coder:14b"}
        with patch("app.routes.models.select_best_models", return_value=selected):
            resp = client.get("/models/auto-select")

        assert resp.status_code == 200
        body = resp.json()
        assert body["auto_available"] is True
        assert body["vision_model"] == "llava:13b"
        assert body["coding_model"] == "qwen2.5-coder:14b"

    def test_devuelve_auto_available_false_cuando_sin_modelos(self, client):
        with patch("app.routes.models.select_best_models", return_value=None):
            resp = client.get("/models/auto-select")

        assert resp.status_code == 200
        assert resp.json()["auto_available"] is False

    def test_devuelve_500_en_excepcion_inesperada(self, client):
        with patch("app.routes.models.select_best_models", side_effect=RuntimeError("crash")):
            resp = client.get("/models/auto-select")

        assert resp.status_code == 500


# ─── POST /models/unload ──────────────────────────────────────────────────────

class TestUnloadModelEndpoint:
    def test_descarga_modelo_correctamente(self, client):
        result = {
            "success": True,
            "message": "Modelo llama3:8b descargado de memoria exitosamente",
            "model": "llama3:8b",
        }
        with patch("app.routes.models.unload_model", return_value=result):
            resp = client.post("/models/unload", json={"model": "llama3:8b"})

        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["model"] == "llama3:8b"

    def test_devuelve_503_cuando_falla_la_descarga(self, client):
        with patch(
            "app.routes.models.unload_model",
            return_value={"success": False, "error": "No se pudo descargar el modelo"},
        ):
            resp = client.post("/models/unload", json={"model": "llama3:8b"})

        assert resp.status_code == 503

    def test_devuelve_422_con_body_invalido(self, client):
        resp = client.post("/models/unload", json={})
        assert resp.status_code == 422

    def test_devuelve_500_en_excepcion_inesperada(self, client):
        with patch("app.routes.models.unload_model", side_effect=RuntimeError("crash")):
            resp = client.post("/models/unload", json={"model": "llama3:8b"})

        assert resp.status_code == 500
