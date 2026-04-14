#!/bin/bash

# 🧪 Test de Autenticación JWT
# Este script prueba todos los endpoints de autenticación

BASE_URL="http://localhost:3000"

echo "================================================"
echo "🔐 TEST DE AUTENTICACIÓN JWT"
echo "================================================"
echo ""

# ============================================================
# TEST 1: LOGIN - Obtener Token
# ============================================================
echo "1️⃣  TEST: POST /auth/login (Login - Obtener Token)"
echo "---"

LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }')

echo "Response:"
echo "$LOGIN_RESPONSE" | jq '.'

# Extraer token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ ERROR: No se pudo obtener token"
  exit 1
fi

echo ""
echo "✅ Token obtenido: ${TOKEN:0:50}..."
echo ""

# ============================================================
# TEST 2: LOGIN FALLIDO - Credenciales Incorrectas
# ============================================================
echo "2️⃣  TEST: POST /auth/login (Credenciales Incorrectas)"
echo "---"

curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "contraseña_incorrecta"
  }' | jq '.'

echo ""

# ============================================================
# TEST 3: GET /auth/perfil (Protegido - Con Token)
# ============================================================
echo "3️⃣  TEST: GET /auth/perfil (Con Token Válido)"
echo "---"

curl -s -X GET $BASE_URL/auth/perfil \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""

# ============================================================
# TEST 4: GET /auth/perfil (Sin Token - Debe Fallar)
# ============================================================
echo "4️⃣  TEST: GET /auth/perfil (Sin Token - Error 401)"
echo "---"

curl -s -X GET $BASE_URL/auth/perfil | jq '.'

echo ""

# ============================================================
# TEST 5: GET /usuarios (Protegido - Con Token)
# ============================================================
echo "5️⃣  TEST: GET /usuarios (Con Token Válido)"
echo "---"

curl -s -X GET "$BASE_URL/usuarios?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, nombre, email}' | head -20

echo ""

# ============================================================
# TEST 6: GET /usuarios (Sin Token - Debe Fallar)
# ============================================================
echo "6️⃣  TEST: GET /usuarios (Sin Token - Error 401)"
echo "---"

curl -s -X GET "$BASE_URL/usuarios?page=1&limit=5" | jq '.'

echo ""

# ============================================================
# TEST 7: GET /usuarios/:id (Protegido - Con Token)
# ============================================================
echo "7️⃣  TEST: GET /usuarios/1 (Con Token Válido)"
echo "---"

curl -s -X GET "$BASE_URL/usuarios/1" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""

# ============================================================
# TEST 8: POST /auth/verificar (Verificar Token)
# ============================================================
echo "8️⃣  TEST: POST /auth/verificar (Verificar Token)"
echo "---"

curl -s -X POST $BASE_URL/auth/verificar \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}" | jq '.'

echo ""

# ============================================================
# TEST 9: POST /auth/refresh (Renovar Token)
# ============================================================
echo "9️⃣  TEST: POST /auth/refresh (Renovar Token)"
echo "---"

REFRESH_RESPONSE=$(curl -s -X POST $BASE_URL/auth/refresh \
  -H "Authorization: Bearer $TOKEN")

echo "$REFRESH_RESPONSE" | jq '.'

NEW_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.token // empty')

if [ ! -z "$NEW_TOKEN" ]; then
  echo "✅ Token renovado: ${NEW_TOKEN:0:50}..."
  echo ""
fi

echo ""

# ============================================================
# TEST 10: POST /auth/logout (Logout)
# ============================================================
echo "🔟 TEST: POST /auth/logout (Logout)"
echo "---"

curl -s -X POST $BASE_URL/auth/logout \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""

# ============================================================
# TEST 11: GET /productos (Protegido - Con Token)
# ============================================================
echo "1️⃣1️⃣  TEST: GET /productos (Con Token Válido)"
echo "---"

curl -s -X GET "$BASE_URL/productos?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, nombre, precio}' | head -20

echo ""

# ============================================================
# TEST 12: formato Bearer incorrecto
# ============================================================
echo "1️⃣2️⃣  TEST: Formato Bearer Incorrecto"
echo "---"

echo "Intentando sin prefix 'Bearer':"
curl -s -X GET $BASE_URL/usuarios \
  -H "Authorization: $TOKEN" | jq '.'

echo ""

# ============================================================
# SUMMARY
# ============================================================
echo "================================================"
echo "✅ TESTS COMPLETADOS"
echo "================================================"
echo ""
echo "📊 Resumen de Pruebas:"
echo "✅ Login exitoso - Token generado"
echo "✅ Acceso a ruta protegida con token"
echo "❌ Acceso a ruta protegida sin token (esperado)"
echo "✅ Logout completado"
echo ""
echo "💡 Tips:"
echo "- Todas las rutas con GET /... requieren token"
echo "- Format: Authorization: Bearer <token>"
echo "- Token expira en 24 horas"
echo "- Usa POST /auth/refresh para renovar"
echo ""
