import test from "node:test";
import assert from "node:assert/strict";
import { emptyProgress } from "../../src/domain.js";
import { getGoogleSyncConfig } from "../../src/sync/config.js";
import { createSyncEnvelope, readSyncEnvelope } from "../../src/sync/google-drive.js";

test("la sincronización permanece desactivada sin Client ID", () => {
  assert.equal(getGoogleSyncConfig().enabled, false);
  assert.equal(getGoogleSyncConfig({ clientId: "" }).enabled, false);
  assert.equal(getGoogleSyncConfig({ clientId: " public-id " }).clientId, "public-id");
});

test("el envoltorio de progreso es versionado y validado", () => {
  const progress = emptyProgress("contenido-1");
  const envelope = createSyncEnvelope(progress, "contenido-1", "device-1");
  assert.equal(envelope.format, "lgss-progress-sync");
  assert.equal(envelope.clientInstanceId, "device-1");
  assert.deepEqual(readSyncEnvelope(envelope).progress, progress);
  assert.throws(() => readSyncEnvelope({ ...envelope, formatVersion: 99 }), /compatible/u);
});
