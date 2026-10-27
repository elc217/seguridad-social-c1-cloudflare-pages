#!/bin/bash
# Script para compilar Android usando Docker

set -e

echo "🔨 Building Android APK using Docker..."

# Generar iconos y splash screens primero
echo "📦 Generating icons and splash screens..."
npm run generate-icons
npm run generate-splash

# Sincronizar Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync android

# Construir imagen Docker si no existe
if ! docker image inspect lgss-android-builder > /dev/null 2>&1; then
    echo "🐳 Building Docker image..."
    docker build -f Dockerfile.android -t lgss-android-builder .
fi

# Ejecutar build en Docker
echo "🚀 Building APK in Docker container..."
docker run --rm -v "$(pwd):/app" lgss-android-builder bash -c "
    cd /app/android
    ./gradlew assembleDebug
"

# Copiar APK a dist
mkdir -p dist
cp android/app/build/outputs/apk/debug/app-debug.apk dist/

echo "✅ APK generated: dist/app-debug.apk"
