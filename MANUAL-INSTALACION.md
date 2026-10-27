# Manual de instalación y distribución
## LGSS Seguridad Social C1

**Autor:** Luis Enrique Algueró Martín  
**ECAP · 2026**

## PWA y versión web

### Uso local

```bash
cd version-unificada
npm install
npm start
```

Abrir:

```text
http://127.0.0.1:8766
```

### Cloudflare Pages

El paquete de publicación se genera con:

```bash
cd version-unificada
npm run package
```

Se obtiene `lgss-c1-cloudflare.zip`. Se puede subir mediante **Direct Upload** en Cloudflare Pages. No necesita comando de build.

## macOS

Hay dos instaladores:

- `LGSS Seguridad Social C1-1.0.0.dmg`: Mac Intel.
- `LGSS Seguridad Social C1-1.0.0-arm64.dmg`: Apple Silicon.

Abrir el DMG, arrastrar la aplicación a **Applications** y ejecutarla. Al no disponer de firma Apple de distribución, macOS puede mostrar una advertencia. En ese caso, usar Ctrl + clic sobre la aplicación y seleccionar **Abrir**.

## Windows

Descargar el artifact `windows-installer` desde GitHub Actions y ejecutar:

```text
LGSS Seguridad Social C1 Setup 1.0.0.exe
```

Seguir las instrucciones del instalador.

## Android

Descargar el artifact `android-apk`, descomprimirlo y transferir `app-debug.apk` al dispositivo. Android puede solicitar permiso para instalar aplicaciones procedentes de esa fuente.

El APK actual es de depuración y está pensado para pruebas, no para publicación en Google Play.

## iOS

Descargar el artifact `ios-ipa`. El IPA de CI se genera sin firma de distribución. Para instalarlo en un dispositivo físico hay que firmarlo con una cuenta Apple válida o utilizarlo dentro del flujo de pruebas correspondiente.

## Builds desde GitHub Actions

Los workflows se encuentran en `.github/workflows/`:

- `build-android.yml`.
- `build-ios.yml`.
- `build-windows.yml`.

Se pueden ejecutar desde la pestaña **Actions** del repositorio.

## Sincronización Google Drive

La aplicación usa el proyecto OAuth de Google Cloud `lgss-c1-sync` y solicita únicamente `drive.appdata`. La sincronización requiere que el usuario autorice su propia cuenta Google.

Para pruebas, la cuenta debe estar añadida como usuario de prueba en Google Cloud. Los Client ID son públicos; nunca se debe incluir un `client_secret` dentro del código o de un instalador.

## Comprobaciones antes de distribuir

1. Ejecutar `npm test`.
2. Ejecutar `npm run package`.
3. Verificar que la biblioteca carga.
4. Crear un test y finalizarlo.
5. Exportar e importar progreso.
6. Probar Google Drive con una cuenta autorizada.
7. Verificar los enlaces al BOE.
8. Confirmar la plataforma y arquitectura del instalador.
