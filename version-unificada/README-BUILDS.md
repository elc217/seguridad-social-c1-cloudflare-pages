# LGSS Seguridad Social C1 - Multi-Platform Builds

Aplicación de estudio para la oposición de Administrativos C1 de Seguridad Social, disponible en múltiples plataformas manteniendo el aspecto original.

## 📦 Builds Disponibles

### ✅ Completados
- **PWA** - Versión web instalable (manifest.json + service worker)
- **Mac Intel (x64)** - Aplicación de escritorio DMG (120MB)
- **Mac Apple Silicon (ARM64)** - Aplicación de escritorio DMG (116MB)

### ⏳ Requisitos Adicionales
- **Windows** - Requiere Windows para compilar
- **Android APK** - Requiere Java 11+
- **iOS IPA** - Requiere Xcode

## 🚀 Inicio Rápido

### Desarrollar o probar PWA
```bash
cd version-unificada
npm start
# Abrir http://127.0.0.1:8766
```

### Probar versión de escritorio localmente
```bash
npm run electron
```

### Generar builds de escritorio
```bash
# Mac Intel
npm run build:mac-intel

# Mac Apple Silicon
npm run build:mac-arm

# Windows (desde Windows)
npm run build:win
```

### Generar builds móviles
```bash
# Android (requiere Java 11+)
npm run build:android

# iOS (requiere Xcode)
npm run cap:ios
# Luego abrir en Xcode y generar el IPA
```

## 📁 Archivos Generados

```
dist/
├── LGSS Seguridad Social C1-1.0.0.dmg           # Mac Intel
└── LGSS Seguridad Social C1-1.0.0-arm64.dmg     # Mac Apple Silicon
```

## 📖 Documentación Completa

Ver [BUILDS.md](./BUILDS.md) para:
- Prerrequisitos detallados
- Instrucciones paso a paso
- Solución de problemas
- Guía de instalación para cada plataforma

## 🎨 Aspecto Original

Todas las versiones mantienen el aspecto original porque:
- Usan el mismo código HTML/CSS/JavaScript
- Electron usa Chromium (motor de Chrome)
- Capacitor usa WebView nativo
- No se modificaron estilos ni lógica

## 🛠️ Tecnologías

- **Web**: HTML5, CSS3, JavaScript (vanilla)
- **Escritorio**: Electron
- **Móvil**: Capacitor
- **PWA**: Service Worker + Web App Manifest

## 📋 Licencia

Misma que la aplicación original.
