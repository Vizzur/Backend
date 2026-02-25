#!/bin/bash

# Script de prueba para todas las operaciones CRUD
# Uso: ./test-crud.sh

BASE_URL="http://localhost:3000"
CONTENT_TYPE="Content-Type: application/json"

echo "=========================================="
echo "PRUEBAS CRUD - Endpoint /usuarios"
echo "=========================================="
echo ""

# 1. GET - Obtener todos
echo "1️⃣ GET /usuarios - Obtener todos"
echo "---"
curl -s "$BASE_URL/usuarios" | jq '.' | head -20
echo ""
echo ""

# 2. GET - Obtener uno
echo "2️⃣ GET /usuarios/:id - Obtener usuario 1"
echo "---"
curl -s "$BASE_URL/usuarios/1" | jq '.'
echo ""
echo ""

# 3. PUT - Actualizar nombre
echo "3️⃣ PUT /usuarios/:id - Actualizar nombre"
echo "---"
curl -s -X PUT "$BASE_URL/usuarios/1" \
  -H "$CONTENT_TYPE" \
  -d '{"nombre":"Juan Pérez Actualizado"}' | jq '.'
echo ""
echo ""

# 4. PUT - Actualizar múltiples campos
echo "4️⃣ PUT /usuarios/:id - Actualizar múltiples campos"
echo "---"
curl -s -X PUT "$BASE_URL/usuarios/2" \
  -H "$CONTENT_TYPE" \
  -d '{
    "nombre":"María Updated",
    "email":"maria.updated@example.com",
    "activo":false
  }' | jq '.'
echo ""
echo ""

# 5. GET - Verificar actualización
echo "5️⃣ GET /usuarios/:id - Verificar usuario 2 actualizado"
echo "---"
curl -s "$BASE_URL/usuarios/2" | jq '.'
echo ""
echo ""

# 6. DELETE - Eliminar usuario
echo "6️⃣ DELETE /usuarios/:id - Eliminar usuario 5"
echo "---"
curl -s -X DELETE "$BASE_URL/usuarios/5" | jq '.'
echo ""
echo ""

# 7. GET - Verificar que fue eliminado
echo "7️⃣ GET /usuarios - Verificar que usuario 5 fue eliminado (debe haber 4)"
echo "---"
curl -s "$BASE_URL/usuarios" | jq '.message'
echo ""
echo ""

# 8. Error - Intentar obtener eliminado
echo "8️⃣ GET /usuarios/:id - Intentar obtener usuario eliminado (404)"
echo "---"
curl -s "$BASE_URL/usuarios/5" | jq '.'
echo ""
echo ""

# 9. Error - ID inválido
echo "9️⃣ PUT /usuarios/:id - ID inválido (400)"
echo "---"
curl -s -X PUT "$BASE_URL/usuarios/abc" \
  -H "$CONTENT_TYPE" \
  -d '{"nombre":"Test"}' | jq '.'
echo ""
echo ""

# 10. Error - Email duplicado
echo "🔟 PUT /usuarios/:id - Email duplicado (409)"
echo "---"
curl -s -X PUT "$BASE_URL/usuarios/1" \
  -H "$CONTENT_TYPE" \
  -d '{"email":"maria.updated@example.com"}' | jq '.'
echo ""
echo ""

echo "=========================================="
echo "Pruebas completadas ✅"
echo "=========================================="
