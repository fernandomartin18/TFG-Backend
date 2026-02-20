"""Tests para la ruta /generate usando TestClient de FastAPI."""
import pytest
from io import BytesIO
from unittest.mock import patch


# ─── Helpers ──────────────────────────────────────────────────────────────────

OLLAMA_MESSAGE_RESP = {"message": {"content": "def hello(): pass"}}
OLLAMA_CHOICES_RESP = {"choices": [{"message": {"content": "result via choices"}}]}
OLLAMA_RESPONSE_RESP = {"response": "result via response key"}


# ─── POST /generate/ ──────────────────────────────────────────────────────────

class TestGenerateEndpoint:
    def test_genera_correctamente_sin_imagen(self, client):
        with patch(
            "app.routes.generate.generate_with_image",
            return_value=OLLAMA_MESSAGE_RESP,
        ):
            resp = client.post(
                "/generate/",
                data={"model": "llama3:8b", "prompt": "genera hola mundo"},
            )

        assert resp.status_code == 200
        assert resp.json()["result"] == "def hello(): pass"

    def test_genera_con_imagen(self, client):
        with patch(
            "app.routes.generate.generate_with_image",
            return_value=OLLAMA_MESSAGE_RESP,
        ):
            resp = client.post(
                "/generate/",
                data={"model": "llava:13b", "prompt": "describe"},
                files={"image": ("test.png", BytesIO(b"fake_png_data"), "image/png")},
            )

        assert resp.status_code == 200

    def test_rechaza_imagen_mayor_a_10mb(self, client):
        big_image = b"x" * (10 * 1024 * 1024 + 1)
        resp = client.post(
            "/generate/",
            data={"model": "llava:13b", "prompt": "describe"},
            files={"image": ("big.png", BytesIO(big_image), "image/png")},
        )

        assert resp.status_code == 400
        assert "10MB" in resp.json()["detail"]

    def test_devuelve_500_con_respuesta_vacia_de_ollama(self, client):
        # {"response": ""} hace que _extract_content devuelva "" → 500
        with patch(
            "app.routes.generate.generate_with_image",
            return_value={"response": ""},
        ):
            resp = client.post(
                "/generate/",
                data={"model": "llama3:8b", "prompt": "test"},
            )

        assert resp.status_code == 500
        assert "vacía" in resp.json()["detail"]

    def test_devuelve_500_en_error_de_servicio(self, client):
        with patch(
            "app.routes.generate.generate_with_image",
            side_effect=Exception("Ollama caído"),
        ):
            resp = client.post(
                "/generate/",
                data={"model": "llama3:8b", "prompt": "test"},
            )

        assert resp.status_code == 500

    def test_devuelve_422_sin_campos_requeridos(self, client):
        resp = client.post("/generate/", data={"prompt": "sin modelo"})
        assert resp.status_code == 422

    def test_parsea_formato_choices(self, client):
        with patch(
            "app.routes.generate.generate_with_image",
            return_value=OLLAMA_CHOICES_RESP,
        ):
            resp = client.post(
                "/generate/",
                data={"model": "llama3:8b", "prompt": "test"},
            )

        assert resp.status_code == 200
        assert resp.json()["result"] == "result via choices"

    def test_parsea_formato_response(self, client):
        with patch(
            "app.routes.generate.generate_with_image",
            return_value=OLLAMA_RESPONSE_RESP,
        ):
            resp = client.post(
                "/generate/",
                data={"model": "llama3:8b", "prompt": "test"},
            )

        assert resp.status_code == 200
        assert resp.json()["result"] == "result via response key"


# ─── POST /generate/stream ─────────────────────────────────────────────────────

class TestGenerateStreamEndpoint:
    def test_streaming_devuelve_chunks(self, client):
        def fake_stream(*args, **kwargs):
            yield "chunk 1"
            yield "chunk 2"

        with patch(
            "app.routes.generate.generate_with_image_stream",
            side_effect=fake_stream,
        ):
            resp = client.post(
                "/generate/stream",
                data={"model": "llama3:8b", "prompt": "genera algo"},
            )

        assert resp.status_code == 200
        content = resp.text
        assert "chunk 1" in content
        assert "chunk 2" in content
        assert "[DONE]" in content

    def test_stream_rechaza_mas_de_5_imagenes(self, client):
        images = [
            ("images", (f"img{i}.png", BytesIO(b"data"), "image/png"))
            for i in range(6)
        ]
        resp = client.post(
            "/generate/stream",
            data={"model": "llama3:8b", "prompt": "test"},
            files=images,
        )

        assert resp.status_code == 400
        assert "5" in resp.json()["detail"]

    def test_stream_rechaza_imagen_grande(self, client):
        big = b"x" * (10 * 1024 * 1024 + 1)
        resp = client.post(
            "/generate/stream",
            data={"model": "llama3:8b", "prompt": "test"},
            files={"images": ("big.png", BytesIO(big), "image/png")},
        )

        assert resp.status_code == 400
