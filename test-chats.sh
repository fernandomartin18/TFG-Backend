#!/bin/bash

# Script para probar los endpoints de chats, mensajes y códigos
# Asegúrate de tener el servidor corriendo en http://localhost:3000

BASE_URL="http://localhost:3000/api"
EMAIL="test@example.com"
PASSWORD="Test123456"

echo "=========================================="
echo "  Test de Chats, Mensajes y Códigos"
echo "=========================================="
echo ""

# 1. Registrar un usuario (si no existe)
echo "1. Registrando usuario..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"TestUser\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# 2. Login
echo "2. Iniciando sesión..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extraer token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token de acceso"
  exit 1
fi

echo "✅ Token obtenido: ${ACCESS_TOKEN:0:20}..."
echo ""

# 3. Crear un chat
echo "3. Creando un nuevo chat..."
CREATE_CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/chats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Chat de Prueba"
  }')
echo "$CREATE_CHAT_RESPONSE" | jq . 2>/dev/null || echo "$CREATE_CHAT_RESPONSE"
echo ""

CHAT_ID=$(echo "$CREATE_CHAT_RESPONSE" | jq -r '.chat.id')

if [ "$CHAT_ID" == "null" ] || [ -z "$CHAT_ID" ]; then
  echo "❌ Error: No se pudo crear el chat"
  exit 1
fi

echo "✅ Chat creado con ID: $CHAT_ID"
echo ""

# 4. Obtener todos los chats
echo "4. Obteniendo todos los chats del usuario..."
curl -s -X GET "$BASE_URL/chats" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq . 2>/dev/null
echo ""

# 5. Crear un mensaje de usuario
echo "5. Creando mensaje de usuario..."
CREATE_USER_MESSAGE=$(curl -s -X POST "$BASE_URL/chats/$CHAT_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "role": "user",
    "content": "Hola, ¿puedes crear un script de Python para calcular factorial?"
  }')
echo "$CREATE_USER_MESSAGE" | jq . 2>/dev/null || echo "$CREATE_USER_MESSAGE"
echo ""

USER_MESSAGE_ID=$(echo "$CREATE_USER_MESSAGE" | jq -r '.data.id')

# 6. Crear un mensaje de asistente
echo "6. Creando mensaje de asistente..."
CREATE_ASSISTANT_MESSAGE=$(curl -s -X POST "$BASE_URL/chats/$CHAT_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "role": "assistant",
    "content": "Claro, aquí tienes el código para calcular el factorial:",
    "modelsUsed": ["llama3.1", "codellama"]
  }')
echo "$CREATE_ASSISTANT_MESSAGE" | jq . 2>/dev/null || echo "$CREATE_ASSISTANT_MESSAGE"
echo ""

ASSISTANT_MESSAGE_ID=$(echo "$CREATE_ASSISTANT_MESSAGE" | jq -r '.data.id')

# 7. Guardar código generado
echo "7. Guardando código generado..."
CODE_CONTENT="def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))"
CREATE_CODE=$(curl -s -X POST "$BASE_URL/messages/$ASSISTANT_MESSAGE_ID/codes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"modelUsed\": \"codellama\",
    \"codeContent\": \"$CODE_CONTENT\",
    \"language\": \"python\",
    \"filename\": \"factorial.py\",
    \"codeOrder\": 1
  }")
echo "$CREATE_CODE" | jq . 2>/dev/null || echo "$CREATE_CODE"
echo ""

CODE_ID=$(echo "$CREATE_CODE" | jq -r '.code.id')

# 8. Obtener mensajes del chat
echo "8. Obteniendo todos los mensajes del chat..."
curl -s -X GET "$BASE_URL/chats/$CHAT_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq . 2>/dev/null
echo ""

# 9. Obtener un chat específico con todos sus mensajes
echo "9. Obteniendo chat específico con mensajes..."
curl -s -X GET "$BASE_URL/chats/$CHAT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq . 2>/dev/null
echo ""

# 10. Obtener códigos del mensaje
echo "10. Obteniendo códigos generados del mensaje..."
curl -s -X GET "$BASE_URL/messages/$ASSISTANT_MESSAGE_ID/codes" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq . 2>/dev/null
echo ""

# 11. Registrar descarga del código
echo "11. Registrando descarga del código..."
curl -s -X POST "$BASE_URL/codes/$CODE_ID/download" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq . 2>/dev/null
echo ""

# 12. Actualizar título del chat
echo "12. Actualizando título del chat..."
curl -s -X PUT "$BASE_URL/chats/$CHAT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Chat de Python - Factorial"
  }' | jq . 2>/dev/null
echo ""

# 13. Verificar actualización
echo "13. Verificando actualización del chat..."
curl -s -X GET "$BASE_URL/chats/$CHAT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq . 2>/dev/null
echo ""

echo "=========================================="
echo "  ✅ Tests completados exitosamente"
echo "=========================================="
echo ""
echo "IDs generados:"
echo "  - Chat ID: $CHAT_ID"
echo "  - User Message ID: $USER_MESSAGE_ID"
echo "  - Assistant Message ID: $ASSISTANT_MESSAGE_ID"
echo "  - Code ID: $CODE_ID"
echo ""
echo "Para limpiar, puedes ejecutar:"
echo "  curl -X DELETE \"$BASE_URL/chats/$CHAT_ID\" -H \"Authorization: Bearer $ACCESS_TOKEN\""
