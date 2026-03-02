"""Tests para las funciones puras y de servicio de ollama_service.py"""
import pytest
from unittest.mock import patch, MagicMock
import requests

from app.services.ollama_service import (
    _extract_model_size,
    _is_vision_model,
    _is_coding_model,
    list_models,
    generate_with_image,
    select_best_models,
    unload_model,
    _call_ollama,
)


# ─── _extract_model_size ────────────────────────────────────────────────────

class TestExtractModelSize:
    def test_extrae_tamaño_con_prefijo_dos_puntos(self):
        assert _extract_model_size("llama3:8b") == 8

    def test_extrae_tamaño_grande(self):
        assert _extract_model_size("qwen2.5-coder:72b") == 72

    def test_extrae_tamaño_sin_dos_puntos(self):
        assert _extract_model_size("mistral7b") == 7

    def test_retorna_cero_para_nombre_sin_tamaño(self):
        assert _extract_model_size("somemodel") == 0

    def test_extrae_tamaño_mayusculas(self):
        assert _extract_model_size("Llama3:70B") == 70

    def test_extrae_primer_coincidencia(self):
        # modelo con varios números, elige el que va después de ':'
        assert _extract_model_size("model:14b-extra") == 14


# ─── _is_vision_model ────────────────────────────────────────────────────────

class TestIsVisionModel:
    @pytest.mark.parametrize("name", [
        "qwen2-vl:7b",
        "llava:13b",
        "bakllava:7b",
        "moondream:1.8b",
        "model-vision:8b",
    ])
    def test_detecta_modelos_de_vision(self, name):
        assert _is_vision_model(name) is True

    @pytest.mark.parametrize("name", [
        "llama3:8b",
        "mistral:7b",
        "deepseek-coder:6.7b",
        "codellama:13b",
    ])
    def test_no_detecta_modelos_sin_vision(self, name):
        assert _is_vision_model(name) is False


# ─── _is_coding_model ────────────────────────────────────────────────────────

class TestIsCodingModel:
    @pytest.mark.parametrize("name", [
        "codellama:13b",
        "deepseek-coder:6.7b",
        "starcoder:7b",
        "qwen2.5-coder:14b",
        "model-code:8b",
    ])
    def test_detecta_modelos_de_codigo(self, name):
        assert _is_coding_model(name) is True

    @pytest.mark.parametrize("name", [
        "llama3:8b",
        "mistral:7b",
        "llava:13b",
    ])
    def test_no_detecta_modelos_sin_codigo(self, name):
        assert _is_coding_model(name) is False


# ─── list_models ─────────────────────────────────────────────────────────────

class TestListModels:
    def test_retorna_modelos_cuando_respuesta_ok(self):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"models": [{"name": "llama3:8b"}]}
        mock_resp.raise_for_status = MagicMock()

        with patch("app.services.ollama_service.requests.get", return_value=mock_resp):
            result = list_models()

        assert "models" in result
        assert result["models"][0]["name"] == "llama3:8b"

    def test_retorna_error_en_conexion_fallida(self):
        with patch(
            "app.services.ollama_service.requests.get",
            side_effect=requests.exceptions.ConnectionError("refused"),
        ):
            result = list_models()

        assert "error" in result

    def test_retorna_error_en_timeout(self):
        with patch(
            "app.services.ollama_service.requests.get",
            side_effect=requests.exceptions.Timeout(),
        ):
            result = list_models()

        assert "error" in result


# ─── generate_with_image ─────────────────────────────────────────────────────

class TestGenerateWithImage:
    def test_genera_sin_imagen(self):
        expected = {"message": {"content": "resultado"}}
        with patch("app.services.ollama_service._call_ollama", return_value=expected) as mock_call:
            result = generate_with_image(model="llama3:8b", prompt="hola")

        mock_call.assert_called_once()
        payload = mock_call.call_args[0][0]
        assert payload["model"] == "llama3:8b"
        assert payload["stream"] is False
        assert result == expected

    def test_genera_con_imagen(self):
        expected = {"message": {"content": "respuesta con imagen"}}
        image_bytes = b"fake_image_data"
        with patch("app.services.ollama_service._call_ollama", return_value=expected):
            result = generate_with_image(
                model="llava:13b",
                prompt="describe this",
                image_bytes_list=[image_bytes],
            )

        assert result == expected

    def test_multiples_imagenes_codificadas(self):
        expected = {"message": {"content": "ok"}}
        images = [b"img1", b"img2"]
        with patch("app.services.ollama_service._call_ollama", return_value=expected) as mock_call:
            generate_with_image(model="llava:13b", prompt="test", image_bytes_list=images)

        payload = mock_call.call_args[0][0]
        assert len(payload["messages"][0]["images"]) == 2


# ─── select_best_models ──────────────────────────────────────────────────────

class TestSelectBestModels:
    def _models_response(self, names):
        return {"models": [{"name": n} for n in names]}

    def test_selecciona_vision_y_coding_correctamente(self):
        data = self._models_response([
            "llava:7b", "qwen2.5-coder:14b", "llama3:8b"
        ])
        with patch("app.services.ollama_service.list_models", return_value=data):
            result = select_best_models()

        assert result is not None
        assert result["vision_model"] == "llava:7b"
        assert result["coding_model"] == "qwen2.5-coder:14b"

    def test_retorna_none_cuando_no_hay_modelos(self):
        with patch("app.services.ollama_service.list_models", return_value={"models": []}):
            result = select_best_models()

        assert result is None

    def test_retorna_none_sin_modelo_de_vision(self):
        data = self._models_response(["llama3:8b", "mistral:7b"])
        with patch("app.services.ollama_service.list_models", return_value=data):
            result = select_best_models()

        assert result is None

    def test_retorna_none_cuando_list_models_da_error(self):
        with patch(
            "app.services.ollama_service.list_models",
            return_value={"error": "connection failed"},
        ):
            result = select_best_models()

        assert result is None

    def test_elige_modelo_vision_de_mayor_tamaño(self):
        data = self._models_response([
            "llava:7b", "llava:13b", "qwen2.5-coder:14b"
        ])
        with patch("app.services.ollama_service.list_models", return_value=data):
            result = select_best_models()

        assert result["vision_model"] == "llava:13b"


# ─── unload_model ────────────────────────────────────────────────────────────

class TestUnloadModel:
    def test_descarga_modelo_correctamente(self):
        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()

        with patch("app.services.ollama_service.requests.post", return_value=mock_resp):
            result = unload_model("llama3:8b")

        assert result["success"] is True
        assert result["model"] == "llama3:8b"
        assert "descargado" in result["message"]

    def test_retorna_error_cuando_falla_la_peticion(self):
        with patch(
            "app.services.ollama_service.requests.post",
            side_effect=requests.exceptions.ConnectionError("refused"),
        ):
            result = unload_model("llama3:8b")

        assert result["success"] is False
        assert "error" in result


# ─── _call_ollama ─────────────────────────────────────────────────────────────

class TestCallOllama:
    def test_llama_a_ollama_y_devuelve_json(self):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"message": {"content": "ok"}}
        mock_resp.raise_for_status = MagicMock()

        with patch("app.services.ollama_service.requests.post", return_value=mock_resp):
            result = _call_ollama({"model": "llama3:8b", "messages": []})

        assert result["message"]["content"] == "ok"

    def test_lanza_excepcion_en_conexion_fallida(self):
        with patch(
            "app.services.ollama_service.requests.post",
            side_effect=requests.exceptions.ConnectionError(),
        ):
            with pytest.raises(requests.exceptions.RequestException):
                _call_ollama({"model": "test", "messages": []})
