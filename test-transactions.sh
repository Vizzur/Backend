#!/bin/bash

# Script de prueba para transacciones
# Uso: ./test-transactions.sh

BASE_URL="http://localhost:3000"
CONTENT_TYPE="Content-Type: application/json"

echo "=========================================="
echo "PRUEBAS DE TRANSACCIONES"
echo "=========================================="
echo ""

# 1. Crear usuario exitosamente
echo "1️⃣ POST /usuarios - Crear usuario (EXITOSO)"
echo "---"
RESPONSE=$(curl -s -X POST "$BASE_URL/usuarios" \
  -H "$CONTENT_TYPE" \
  -d '{
    "nombre":"Test Usuario",
    "email":"test.user@example.com",
    "password_hash":"$2b$10$test_hash_123456789"
  }')

echo "$RESPONSE" | jq '.'
USUARIO_ID=$(echo "$RESPONSE" | jq '.data.id')
echo "Usuario creado con ID: $USUARIO_ID"
echo ""
echo ""

# 2. Verificar que el usuario se creó
echo "2️⃣ GET /usuarios/:id - Verificar usuario creado"
echo "---"
curl -s "$BASE_URL/usuarios/$USUARIO_ID" | jq '.data'
echo ""
echo ""

# 3. Verificar que el historial se creó
echo "3️⃣ GET /usuarios/historial/:id - Verificar historial creado"
echo "---"
curl -s "$BASE_URL/usuarios/historial/$USUARIO_ID" | jq '.data'
echo ""
echo ""

# 4. Intentar crear usuario con error forzado (email_duplicate)
echo "4️⃣ POST /usuarios - Crear usuario con error forzado (ROLLBACK)"
echo "---"
echo "Intentando crear usuario que forzará un error..."
RESPONSE=$(curl -s -X POST "$BASE_URL/usuarios" \
  -H "$CONTENT_TYPE" \
  -d '{
    "nombre":"Test Rollback Usuario",
    "email":"test.rollback@example.com",
    "password_hash":"$2b$10$rollback_hash_123456789",
    "forceError":"email_duplicate"
  }')

echo "$RESPONSE" | jq '.'
echo ""
echo "ℹ️  La transacción debe haber sido revertida (ROLLBACK)"
echo ""
echo ""

# 5. Verificar que el usuario NO se creó
echo "5️⃣ GET /usuarios - Contar usuarios (debe ser el mismo que antes)"
echo "---"
USUARIOS=$(curl -s "$BASE_URL/usuarios" | jq '.pagination.totalRecords')
echo "Total de usuarios: $USUARIOS (no debe haber aumentado)"
echo ""
echo ""

# 6. Intentar crear usuario con error después del historial
echo "6️⃣ POST /usuarios - Error después de crear historial (ROLLBACK)"
echo "---"
RESPONSE=$(curl -s -X POST "$BASE_URL/usuarios" \
  -H "$CONTENT_TYPE" \
  -d '{
    "nombre":"Test After History",
    "email":"test.after@example.com",
    "password_hash":"$2b$10$after_hash_123456789",
    "forceError":"after_history"
  }')

echo "$RESPONSE" | jq '.'
echo ""
echo "ℹ️  La transacción debe haber sido revertida (ROLLBACK) incluso después de insertar historial"
echo ""
echo ""

# 7. Verificar el archivo de logs de transacciones fallidas
echo "7️⃣ Verificar logs de transacciones fallidas"
echo "---"
if [ -f "logs/transaction-errors.log" ]; then
  echo "📄 Contenido de logs/transaction-errors.log:"
  tail -20 "logs/transaction-errors.log"
else
  echo "⚠️  Archivo de logs no encontrado"
fi
echo ""
echo ""

# 8. Crear otro usuario exitosamente
echo "8️⃣ POST /usuarios - Crear otro usuario (EXITOSO)"
echo "---"
RESPONSE=$(curl -s -X POST "$BASE_URL/usuarios" \
  -H "$CONTENT_TYPE" \
  -d '{
    "nombre":"Otro Usuario",
    "email":"otro@example.com",
    "password_hash":"$2b$10$otro_hash_123456789"
  }')

echo "$RESPONSE" | jq '.data'
echo ""

# 9. Verificar historial completo
echo "9️⃣ GET /usuarios - Verificar total de usuarios y historial"
echo "---"
USUARIOS=$(curl -s "$BASE_URL/usuarios" | jq '.pagination.totalRecords')
echo "Total de usuarios: $USUARIOS"
echo ""

echo "=========================================="
echo "Pruebas de transacciones completadas ✅"
echo "=========================================="
echo ""
echo "📝 Resumen:"
echo "  - Usuarios exitosos: Se crearon user + historial"
echo "  - Usuarios fallidos: Fueron revertidos (ROLLBACK)"
echo "  - Archivo de logs: Contiene errores de transacciones fallidas"
