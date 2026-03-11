"""Tests para la aplicación principal FastAPI (main.py)."""


class TestRoot:
    def test_endpoint_raiz_devuelve_200(self, client):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_endpoint_raiz_devuelve_status_ok(self, client):
        resp = client.get("/")
        body = resp.json()
        assert body["status"] == "ok"

    def test_endpoint_raiz_devuelve_mensaje(self, client):
        resp = client.get("/")
        body = resp.json()
        assert "message" in body
        assert len(body["message"]) > 0


class TestNotFound:
    def test_ruta_inexistente_devuelve_404(self, client):
        resp = client.get("/no-existe")
        assert resp.status_code == 404


class TestCORS:
    def test_cors_headers_presentes_en_respuesta(self, client):
        resp = client.get("/", headers={"Origin": "http://localhost:3000"})
        assert resp.status_code == 200
        assert "access-control-allow-origin" in resp.headers


class TestRoutersRegistrados:
    def test_ruta_models_accesible(self, client):
        """El prefix /models/ está registrado."""
        from unittest.mock import patch
        with patch("app.routes.models.list_models", return_value={"models": []}):
            resp = client.get("/models/")
        assert resp.status_code == 200

    def test_ruta_generate_accesible(self, client):
        """El prefix /generate/ está registrado (sin body → 422)."""
        resp = client.post("/generate/", data={})
        assert resp.status_code == 422
