import { getGoogleSyncConfig } from "./config.js";

let tokenClient = null;
let accessToken = null;

function googleIdentity() {
  return globalThis.google?.accounts?.oauth2;
}

export function isGoogleConnected() {
  return Boolean(accessToken);
}

export async function connectGoogle() {
  const config = getGoogleSyncConfig();
  if (!config.enabled) throw new Error("La sincronización de Google Drive no está configurada.");
  const identity = googleIdentity();
  if (!identity) throw new Error("No se ha podido cargar el inicio de sesión de Google. Comprueba tu conexión.");
  return new Promise((resolve, reject) => {
    tokenClient = identity.initTokenClient({
      client_id: config.clientId,
      scope: config.scope,
      callback: response => {
        if (response.error) {
          reject(new Error(`Google no autorizó el acceso: ${response.error}`));
          return;
        }
        accessToken = response.access_token;
        resolve(accessToken);
      }
    });
    tokenClient.requestAccessToken({ prompt: accessToken ? "" : "consent" });
  });
}

export function getGoogleAccessToken() {
  return accessToken;
}

export function disconnectGoogle() {
  if (accessToken && globalThis.google?.accounts?.oauth2?.revoke) {
    globalThis.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenClient = null;
}
