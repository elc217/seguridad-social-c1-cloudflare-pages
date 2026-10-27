export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
export const SYNC_FORMAT = "lgss-progress-sync";
export const SYNC_FORMAT_VERSION = 1;
export const PROGRESS_FILENAME = "lgss-c1-progress.json";

export function getGoogleSyncConfig(source = globalThis.__LGSS_GOOGLE_CONFIG__) {
  const clientId = typeof source?.clientId === "string" ? source.clientId.trim() : "";
  return {
    enabled: Boolean(clientId),
    clientId,
    scope: GOOGLE_DRIVE_SCOPE,
    filename: PROGRESS_FILENAME
  };
}
