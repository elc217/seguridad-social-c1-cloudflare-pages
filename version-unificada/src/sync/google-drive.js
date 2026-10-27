import {
  PROGRESS_FILENAME,
  SYNC_FORMAT,
  SYNC_FORMAT_VERSION,
  GOOGLE_DRIVE_SCOPE
} from "./config.js";
import { mergeProgress, validateProgress } from "../domain.js";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
const JSON_TYPE = "application/json";

function authHeaders(accessToken) {
  if (typeof accessToken !== "string" || !accessToken) throw new Error("Falta la autorización de Google Drive.");
  return { Authorization: `Bearer ${accessToken}` };
}

async function responseJson(response) {
  if (!response.ok) {
    let detail = "";
    try { detail = (await response.json()).error?.message ?? ""; } catch {}
    throw new Error(`Google Drive respondió ${response.status}${detail ? `: ${detail}` : "."}`);
  }
  return response.status === 204 ? null : response.json();
}

async function driveFetch(path, accessToken, options = {}) {
  return responseJson(await fetch(`${DRIVE_API}${path}`, {
    ...options,
    headers: { ...authHeaders(accessToken), ...options.headers }
  }));
}

export function createSyncEnvelope(progress, contentVersion, clientInstanceId = crypto.randomUUID()) {
  validateProgress(progress);
  return {
    format: SYNC_FORMAT,
    formatVersion: SYNC_FORMAT_VERSION,
    contentVersion,
    clientInstanceId,
    updatedAt: new Date().toISOString(),
    progress
  };
}

export function readSyncEnvelope(value) {
  if (!value || value.format !== SYNC_FORMAT || value.formatVersion !== SYNC_FORMAT_VERSION) {
    throw new Error("El archivo de sincronización no es compatible.");
  }
  validateProgress(value.progress);
  return value;
}

export async function findProgressFile(accessToken, filename = PROGRESS_FILENAME) {
  const query = encodeURIComponent(`name = '${filename}' and trashed = false`);
  const result = await driveFetch(`/files?spaces=appDataFolder&corpora=user&q=${query}&fields=files(id,name,modifiedTime,version)`, accessToken);
  return result.files?.[0] ?? null;
}

export async function downloadProgress(accessToken, fileId) {
  const value = await driveFetch(`/files/${encodeURIComponent(fileId)}?alt=media`, accessToken);
  return readSyncEnvelope(value);
}

function multipartBody(metadata, envelope, boundary) {
  return [
    `--${boundary}\r\nContent-Type: ${JSON_TYPE}; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${JSON_TYPE}\r\n\r\n`,
    JSON.stringify(envelope),
    `\r\n--${boundary}--\r\n`
  ].join("");
}

export async function uploadProgress(accessToken, envelope, file = null, filename = PROGRESS_FILENAME) {
  readSyncEnvelope(envelope);
  const boundary = `lgss-${crypto.randomUUID()}`;
  const metadata = { name: filename, mimeType: JSON_TYPE, ...(file ? {} : { parents: ["appDataFolder"] }) };
  const url = file ? `${UPLOAD_API}/${encodeURIComponent(file.id)}?uploadType=multipart` : `${UPLOAD_API}?uploadType=multipart`;
  const response = await fetch(url, {
    method: file ? "PATCH" : "POST",
    headers: {
      ...authHeaders(accessToken),
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: multipartBody(metadata, envelope, boundary)
  });
  return responseJson(response);
}

export async function syncProgress({ accessToken, localProgress, incomingProgress, contentVersion, unitIds, filename = PROGRESS_FILENAME }) {
  validateProgress(localProgress);
  const merged = incomingProgress
    ? mergeProgress(localProgress, readSyncEnvelope(incomingProgress).progress, unitIds)
    : localProgress;
  const envelope = createSyncEnvelope(merged, contentVersion);
  const file = await findProgressFile(accessToken, filename);
  await uploadProgress(accessToken, envelope, file, filename);
  return { progress: merged, envelope };
}

export { GOOGLE_DRIVE_SCOPE };
