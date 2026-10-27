export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
export const SYNC_FORMAT = "lgss-progress-sync";
export const SYNC_FORMAT_VERSION = 1;
export const PROGRESS_FILENAME = "lgss-c1-progress.json";

export function getGoogleSyncConfig(source = globalThis.__LGSS_GOOGLE_CONFIG__) {
  const clientId = typeof source?.clientId === "string" ? source.clientId.trim() : "";
  const clients = {
    web: typeof source?.clients?.web === "string" ? source.clients.web.trim() : clientId,
    android: typeof source?.clients?.android === "string" ? source.clients.android.trim() : "",
    ios: typeof source?.clients?.ios === "string" ? source.clients.ios.trim() : "",
    desktop: typeof source?.clients?.desktop === "string" ? source.clients.desktop.trim() : ""
  };
  return {
    enabled: Boolean(clients.web),
    clientId: clients.web,
    clients,
    scope: GOOGLE_DRIVE_SCOPE,
    filename: PROGRESS_FILENAME
  };
}
