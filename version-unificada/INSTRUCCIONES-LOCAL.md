# Instrucciones para Completar Builds Localmente

## Estado Actual

✅ **Completado:**
- PWA (instalable desde navegador)
- Mac Intel DMG (120MB)
- Mac Apple Silicon DMG (116MB)
- Configuración completa para Android, iOS y Windows

⏳ **Pendiente por restricciones del sistema:**
- Android APK (requiere Java 11+ - tienes Java 8)
- iOS IPA (requiere Xcode completo - tienes solo Command Line Tools)
- Windows EXE (requiere Windows - estás en macOS)

## Opción 1: Compilar Android Localmente

### Instalar Java 17
```bash
# Descargar JDK 17 manualmente desde:
# https://adoptium.net/temurin/releases/?version=17

# O usar Homebrew (requiere sudo):
brew install --cask temurin@17

# Configurar JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
```

### Compilar APK
```bash
cd version-unificada
npm run build:android
```

**Resultado:** `android/app/build/outputs/apk/debug/app-debug.apk`

## Opción 2: Compilar iOS Localmente

### Habilitar Xcode
```bash
# Requiere acceso a Xcode completo (no solo Command Line Tools)
sudo xcode-select --switch /Applications/Xcode.app

# Si no tienes Xcode, instalar desde App Store
# https://apps.apple.com/app/xcode/id497799835
```

### Compilar IPA
```bash
cd version-unificada
npm run cap:ios
# Luego abrir Xcode y Product > Archive
```

**Resultado:** IPA desde Xcode

## Opción 3: Usar Docker para Android (Sin instalar Java)

El proyecto incluye un Dockerfile y script para compilar Android en un contenedor:

```bash
cd version-unificada
./docker-build-android.sh
```

**Resultado:** `dist/app-debug.apk`

## Opción 4: Usar GitHub Actions (CI/CD)

El proyecto incluye workflows de GitHub Actions:

1. Sube el código a GitHub
2. Ve a Actions tab
3. Ejecuta "Build Android APK" o "Build iOS IPA"
4. Descarga el artifact generado

**Resultados:**
- Android: `android-apk` artifact
- iOS: `ios-ipa` artifact

## Opción 5: Usar Expo EAS Build (Con tu cuenta Expo)

Si tienes cuenta de Expo, puedes usar EAS Build para compilar en la nube:

```bash
cd version-unificada
npm install -g eas-cli
eas login
eas build --platform android
eas build --platform ios
```

Esto requiere configurar `eas.json` en el proyecto.

## Resumen de Builds por Método

| Plataforma | Local | Docker | GitHub Actions | Expo EAS |
|------------|-------|--------|----------------|----------|
| Android | ✅ (Java 11+) | ✅ | ✅ | ✅ |
| iOS | ✅ (Xcode) | ❌ | ✅ | ✅ |
| Windows | ❌ (necesita Windows) | ❌ | ✅ | ❌ |

## Recomendación

**Más rápido:** Usar GitHub Actions (requiere subir a GitHub)
**Más control:** Instalar Java 17 y compilar Android localmente
**iOS:** Requiere Xcode completo o GitHub Actions

## Instalación de Builds Generados

### Android APK
```bash
# Transferir al dispositivo Android
# Habilitar "Fuentes desconocidas" en Configuración
# Instalar el APK
```

### iOS IPA
```bash
# Usar AltStore, Cydia Impactor o TestFlight
# Instalar el IPA
# Confiar el certificado en Configuración > General > Perfiles
```

## Soporte

Si necesitas ayuda con alguna opción específica, avísame.
