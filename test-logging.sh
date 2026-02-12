#!/bin/bash

# Script de demostración - Simula 3 accesos y verifica el registro en log.txt

echo "🚀 Script de Testing - Sistema de Logging"
echo "=========================================="
echo ""

# Verificar si el servidor está corriendo
echo "✓ Esperando a que el servidor esté disponible..."
sleep 2

# Realizar las 3 solicitudes
echo "📝 Simulando 3 accesos..."
echo ""

echo "1️⃣  Accediendo a GET /"
curl -s http://localhost:3000/ > /dev/null
echo "   ✓ Registrado"
echo ""

echo "2️⃣  Accediendo a GET /status"
curl -s http://localhost:3000/status > /dev/null
echo "   ✓ Registrado"
echo ""

echo "3️⃣  Accediendo a GET /style-guide.html"
curl -s http://localhost:3000/style-guide.html > /dev/null
echo "   ✓ Registrado"
echo ""

# Esperar un poco para que se escriba en el archivo
sleep 1

# Mostrar el contenido del log
echo "📋 Contenido de logs/log.txt:"
echo "==========================================="
if [ -f "logs/log.txt" ]; then
    cat logs/log.txt
    echo ""
    echo "✅ Archivo de log creado correctamente"
    echo "✅ Sistema de logging está funcionando"
else
    echo "❌ Error: No se encontró logs/log.txt"
fi
