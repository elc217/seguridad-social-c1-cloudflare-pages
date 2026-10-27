# Sincronización opcional con Google Drive

La aplicación mantiene el progreso localmente y puede sincronizarlo con el espacio privado `appDataFolder` del Google Drive de cada usuario. No se suben la biblioteca, la legislación ni el banco de preguntas: solo el progreso y los resultados de estudio.

## Estado actual

El núcleo de Drive y el formato versionado están preparados en `src/sync/`. La función permanece desactivada hasta configurar OAuth: no se abre ningún diálogo de Google ni se solicitan permisos si no existe `window.__LGSS_GOOGLE_CONFIG__.clientId`.

## Configuración pendiente

1. Crear un proyecto en Google Cloud.
2. Configurar la pantalla de consentimiento OAuth.
3. Solicitar únicamente el scope:
   `https://www.googleapis.com/auth/drive.appdata`.
4. Crear credenciales para web, Android, iOS y Electron según cada origen, paquete, firma y bundle ID.
5. Inyectar el Client ID público en el build:

```html
<script>
  window.__LGSS_GOOGLE_CONFIG__ = {
    clientId: "CLIENT_ID_PUBLICO.apps.googleusercontent.com"
  };
</script>
```

Nunca incluir un `client_secret` en la aplicación. La autenticación debe abrirse en el navegador del sistema, no dentro de un WebView. Android/iOS necesitarán un adaptador nativo OAuth con navegador externo y Electron necesitará un callback loopback local; el núcleo de `src/sync/google-drive.js` es común a todas las plataformas.

## Política de datos

El usuario debe pulsar explícitamente **Conectar con Google Drive** y aceptar el consentimiento de Google. Si no lo hace, la aplicación continúa funcionando offline y el progreso solo permanece en el dispositivo. La exportación/importación JSON sigue siendo la copia de seguridad independiente.
