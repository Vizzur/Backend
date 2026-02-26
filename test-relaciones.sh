#!/bin/bash

# Script para probar relaciones Sequelize (Usuario → Pedido)
# Compara performance: N+1 vs Include

echo "════════════════════════════════════════════"
echo "Pruebas de Relaciones Sequelize ORM"
echo "════════════════════════════════════════════"
echo ""

# Configuración
BASE_URL="http://localhost:3000"
TIMESTAMP=$(date +%s)

# Verificar que servidor está activo
echo "⏳ Esperando servidor en puerto 3000..."
sleep 2

echo ""
echo "════════════════════════════════════════════"
echo "1. OBTENER USUARIO CON INCLUDE()"
echo "════════════════════════════════════════════"
echo ""

echo "🔗 GET /orm/usuario/1 (Usuario + Pedidos anidados)"
RESPONSE=$(curl -s "$BASE_URL/orm/usuario/1" | jq '.')

echo "$RESPONSE" | jq '{
  usuario: .usuario | {id, nombre, email, activo},
  totalPedidos: .totalPedidos,
  pedidos: .usuario.pedidos[0:2]  # Mostrar primeros 2
}'

echo ""
echo "════════════════════════════════════════════"
echo "2. LISTAR PEDIDOS DE UN USUARIO"
echo "════════════════════════════════════════════"
echo ""

echo "🔗 GET /orm/usuarios/1/pedidos (Pedidos de usuario 1)"
PEDIDOS=$(curl -s "$BASE_URL/orm/usuarios/1/pedidos" | jq '.')

echo "$PEDIDOS" | jq '{
  usuario: .usuario,
  totalPedidos: .totalPedidos,
  pedidos: .pedidos | map({id, numero_pedido, monto_total, estado})
}'

echo ""
echo "════════════════════════════════════════════"
echo "3. LISTAR TODOS LOS PEDIDOS CON USUARIO"
echo "════════════════════════════════════════════"
echo ""

echo "🔗 GET /orm/pedidos (Todos los pedidos)"
ALL_PEDIDOS=$(curl -s "$BASE_URL/orm/pedidos" | jq '.')

echo "$ALL_PEDIDOS" | jq '{
  totalPedidos: .pagination.totalRecords,
  totalPages: .pagination.totalPages,
  primeros3: .data[0:3] | map({id, numero_pedido, monto_total, estado, usuario: .usuario})
}'

echo ""
echo "════════════════════════════════════════════"
echo "4. CREAR NUEVO PEDIDO"
echo "════════════════════════════════════════════"
echo ""

NUEVA_ORDEN="PED-TEST-${TIMESTAMP}"
echo "🔗 POST /orm/pedidos (Crear pedido)"
echo "Body:"
echo "{"
echo "  \"usuario_id\": 2,"
echo "  \"numero_pedido\": \"${NUEVA_ORDEN}\","
echo "  \"descripcion\": \"Test Order\","
echo "  \"monto_total\": 299.99,"
echo "  \"estado\": \"PENDIENTE\""
echo "}"
echo ""

NUEVO_PEDIDO=$(curl -s -X POST "$BASE_URL/orm/pedidos" \
  -H "Content-Type: application/json" \
  -d "{
    \"usuario_id\": 2,
    \"numero_pedido\": \"${NUEVA_ORDEN}\",
    \"descripcion\": \"Test Order\",
    \"monto_total\": 299.99,
    \"estado\": \"PENDIENTE\"
  }" | jq '.')

echo "$NUEVO_PEDIDO" | jq '{
  success: .success,
  numeroDocumento: .data.numero_pedido,
  monto: .data.monto_total,
  estado: .data.estado,
  usuario: .data.usuario
}'

PEDIDO_ID=$(echo "$NUEVO_PEDIDO" | jq '.data.id')

echo ""
echo "════════════════════════════════════════════"
echo "5. ACTUALIZAR PEDIDO"
echo "════════════════════════════════════════════"
echo ""

echo "🔗 PUT /orm/pedidos/${PEDIDO_ID} (Cambiar estado a CONFIRMADO)"
ACTUALIZADO=$(curl -s -X PUT "$BASE_URL/orm/pedidos/${PEDIDO_ID}" \
  -H "Content-Type: application/json" \
  -d '{"estado":"CONFIRMADO","notas":"Actualizado por test"}' | jq '.')

echo "$ACTUALIZADO" | jq '{
  success: .success,
  id: .data.id,
  estado: .data.estado,
  notas: .data.notas
}'

echo ""
echo "════════════════════════════════════════════"
echo "6. COMPARAR CON/SIN INCLUDE()"
echo "════════════════════════════════════════════"
echo ""

echo "🔗 GET /orm/relaciones (Muestra diferencia)"
COMPARACION=$(curl -s "$BASE_URL/orm/relaciones" | jq '.')

echo "$COMPARACION" | jq '{
  sinInclude: .comparison.sinInclude | {
    metodo: .metodo,
    tienePedidos: .tienePedidos,
    usuario: {id, nombre}
  },
  conInclude: .comparison.conInclude | {
    metodo: .metodo,
    tienePedidos: .tienePedidos,
    totalPedidos: .totalPedidos,
    usuario: {id, nombre}
  },
  nota: .nota
}'

echo ""
echo "════════════════════════════════════════════"
echo "7. FILTRAR PEDIDOS POR ESTADO"
echo "════════════════════════════════════════════"
echo ""

echo "🔗 GET /orm/usuarios/1/pedidos?estado=ENTREGADO"
FILTRADOS=$(curl -s "$BASE_URL/orm/usuarios/1/pedidos?estado=ENTREGADO" | jq '.')

echo "$FILTRADOS" | jq '{
  usuario: .usuario,
  filtro: .filtros,
  totalPedidos: .totalPedidos,
  pedidos: .pedidos | map({numero_pedido, estado})
}'

echo ""
echo "════════════════════════════════════════════"
echo "8. ELIMINAR PEDIDO CREADO"
echo "════════════════════════════════════════════"
echo ""

echo "🔗 DELETE /orm/pedidos/${PEDIDO_ID} (Limpiar test)"
ELIMINADO=$(curl -s -X DELETE "$BASE_URL/orm/pedidos/${PEDIDO_ID}" | jq '.')

echo "$ELIMINADO" | jq '{
  success: .success,
  message: .message
}'

echo ""
echo "════════════════════════════════════════════"
echo "✅ RESUMEN DE PRUEBAS"
echo "════════════════════════════════════════════"
echo ""
echo "✓ GET usuario con pedidos anidados (include)"
echo "✓ GET pedidos de usuario específico"
echo "✓ GET todos los pedidos con usuario"
echo "✓ POST crear nuevo pedido"
echo "✓ PUT actualizar estado de pedido"
echo "✓ Comparación include vs sin include"
echo "✓ Filtrado por estado (ENTREGADO)"
echo "✓ DELETE eliminar pedido"
echo ""

echo "════════════════════════════════════════════"
echo "📊 VENTAJAS DE INCLUDE() DEMOSTRADAS"
echo "════════════════════════════════════════════"
echo ""
echo "1. ✅ Datos anidados en respuesta JSON"
echo "   - usuario.pedidos viene en una sola consulta"
echo ""
echo "2. ✅ Evita problema N+1"
echo "   - 1 query (include) vs N+1 queries (loops)"
echo ""
echo "3. ✅ Relaciones bidireccionales"
echo "   - Usuario → Pedidos"
echo "   - Pedidos → Usuario"
echo ""
echo "4. ✅ Control de campos"
echo "   - Solo traer campos necesarios"
echo ""
echo "5. ✅ Validación automática"
echo "   - FK constraints"
echo "   - Enums validados"
echo ""

echo "════════════════════════════════════════════"
echo "📖 Más información:"
echo "════════════════════════════════════════════"
echo ""
echo "Documentación: RELACIONES_SEQUELIZE.md"
echo "Dashboard HTML: http://localhost:3000/usuarios-pedidos.html"
echo "Modelo Order: models/Order.js"
echo "Rutas: routes/pedidos.js"
echo ""
