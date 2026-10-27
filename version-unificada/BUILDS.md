# Guía de Builds - LGSS Seguridad Social C1

Esta guía explica cómo generar las diferentes versiones de la aplicación para múltiples plataformas. Todas las versiones mantienen el aspecto original de la aplicación web.

## Versión PWA (Progressive Web App)

La versión PWA ya está configurada y lista para usar. Los archivos generados incluyen:

- `manifest.json` - Configuración de la PWA
- `sw.js` - Service Worker para caché offline
- Iconos en múltiples tamaños (72x72 a 1024x1024)

### Instalación PWA
1. Servir la aplicación: `npm start`
2. Abrir en navegador compatible (Chrome, Edge, Safari)
3. Usar la opción "Instalar" del navegador

## Versiones de Escritorio (Electron)

### Prerrequisitos
- Node.js 20+
- npm

### Mac Intel (x64)
```bash
npm run build:mac-intel
```
**Salida**: `dist/LGSS Seguridad Social C1-1.0.0.dmg` (120MB)

### Mac Apple Silicon (ARM64)
```bash
npm run build:mac-arm
```
**Salida**: `dist/LGSS Seguridad Social C1-1.0.0-arm64.dmg` (116MB)

### Windows (requiere Windows)
**No disponible desde macOS**. Para generar el build de Windows:

1. Copiar el proyecto a una máquina Windows
2. Instalar Node.js 20+
3. Ejecutar: `npm run build:win`
4. **Salida esperada**: `dist/LGSS Seguridad Social C1 Setup 1.0.0.exe`

### Linux (opcional)
```bash
npm run build:all
```
**Salida**: `dist/LGSS Seguridad Social C1-1.0.0.AppImage`

### Test local de Electron
```bash
npm run electron
```

## Versiones Móviles (Capacitor)

### Prerrequisitos

#### Android
- Java 11 o superior (Java 8 no funciona)
- Android SDK
- Gradle (incluido en el proyecto)

#### iOS
- macOS
- Xcode 14+
- Xcode Command Line Tools

### Configuración

El proyecto ya tiene las plataformas Android e iOS configuradas:
- `android/` - Proyecto Android nativo
- `ios/` - Proyecto iOS nativo
- `capacitor.config.json` - Configuración de Capacitor

### Actualizar assets web
```bash
npm run cap:sync
```

### Android APK

**Estado**: Configurado pero requiere Java 11+

Para generar el APK:

1. Instalar Java 11+:
   ```bash
   # En macOS usando Homebrew
   brew install openjdk@11
   export JAVA_HOME=$(/usr/libexec/java_home -v 11)
   ```

2. Generar el APK:
   ```bash
   npm run build:android
   ```

3. **Salida**: `android/app/build/outputs/apk/debug/app-debug.apk`

### Alternativa: Abrir en Android Studio
```bash
npm run cap:android
```
Luego abrir el proyecto en Android Studio y generar el APK desde allí.

### iOS IPA

**Estado**: Configurado pero requiere Xcode

Para generar el IPA:

1. Abrir el proyecto en Xcode:
   ```bash
   npm run cap:ios
   ```

2. En Xcode:
   - Seleccionar un dispositivo o simulador
   - Product > Archive
   - Distribute App > Ad Hoc o Development

3. **Salida**: IPA generado en la ubicación que elijas

### Iconos y Splash Screens

Ya se generaron iconos en múltiples tamaños y splash screens para móviles:

**Iconos**: `assets/icon-*.png` (72x72 a 1024x1024)
**Splash**: `assets/splash-*.png` (1792x1792 y 2732x2732)

Para regenerar:
```bash
npm run generate-icons
npm run generate-splash
```

## Estructura de Archivos Generados

```
version-unificada/
├── dist/                          # Builds de escritorio
│   ├── LGSS Seguridad Social C1-1.0.0.dmg           # Mac Intel
│   ├── LGSS Seguridad Social C1-1.0.0-arm64.dmg     # Mac Apple Silicon
│   └── (Windows exe cuando se compile en Windows)
├── android/                       # Proyecto Android
│   └── app/build/outputs/apk/debug/app-debug.apk   # APK (cuando se compile)
├── ios/                           # Proyecto iOS
│   └── (IPA cuando se compile en Xcode)
├── www/                           # Carpeta web para Capacitor
├── manifest.json                  # Configuración PWA
├── sw.js                          # Service Worker PWA
└── assets/                        # Iconos y recursos
    ├── icon-*.png
    └── splash-*.png
```

## Notas Importantes

### Firma de Código (macOS)
Los builds de Mac no están firmados con certificado de Apple. Esto causa advertencias al abrir la aplicación. Para producción:

1. Obtener un "Developer ID Application" de Apple
2. Configurar en `package.json`:
   ```json
   "mac": {
     "identity": "YOUR_IDENTITY"
   }
   ```

### Windows Build
No se puede generar desde macOS. Debes:
- Usar una máquina Windows real
- O usar una VM de Windows en macOS
- O usar GitHub Actions con Windows runner

### Aspecto Original
Todas las versiones mantienen el aspecto original porque:
- Usan el mismo HTML/CSS/JavaScript
- Electron renderiza usando Chromium (motor de Chrome)
- Capacitor usa WebView nativo que es muy similar a Chrome
- No se modificaron los estilos ni la lógica de la aplicación

## Resumen de Builds Disponibles

| Plataforma | Estado | Comando | Salida |
|------------|--------|---------|--------|
| PWA | ✅ Listo | Servir con `npm start` | Instalable desde navegador |
| Mac Intel | ✅ Generado | `npm run build:mac-intel` | `dist/*.dmg` (120MB) |
| Mac ARM64 | ✅ Generado | `npm run build:mac-arm` | `dist/*-arm64.dmg` (116MB) |
| Windows | ⏳ Requiere Windows | `npm run build:win` (en Windows) | `dist/*.exe` |
| Android | ⏳ Requiere Java 11+ | `npm run build:android` | `android/app/build/outputs/apk/debug/app-debug.apk` |
| iOS | ⏳ Requiere Xcode | `npm run cap:ios` + Xcode | IPA desde Xcode |

## Pasos Siguientes

Para completar los builds pendientes:

1. **Windows**: Copiar el proyecto a una máquina Windows y ejecutar `npm run build:win`
2. **Android**: Instalar Java 11+ y ejecutar `npm run build:android`
3. **iOS**: Abrir en Xcode con `npm run cap:ios` y generar el IPA

## Instalación de los Builds

### Mac (DMG)
1. Descargar el `.dmg` correspondiente (Intel o ARM64)
2. Doble clic para montar
3. Arrastrar la aplicación a Applications
4. Al abrir: Cmd+Clic + Abrir (por no estar firmado)

### Windows (EXE)
1. Descargar el `.exe`
2. Doble clic para instalar
3. Seguir el instalador

### Android (APK)
1. Transferir el APK al dispositivo
2. Habilitar "Fuentes desconocidas" en configuración
3. Instalar el APK

### iOS (IPA)
1. Usar AltStore, Cydia Impactor o TestFlight
2. Instalar el IPA
3. Confiar el certificado en Configuración > General > Perfiles

## Soporte

Para problemas específicos:
- **Electron**: https://www.electron.build/
- **Capacitor**: https://capacitorjs.com/docs/
- **Android**: https://developer.android.com/
- **iOS**: https://developer.apple.com/
