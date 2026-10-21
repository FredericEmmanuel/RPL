import assert from "node:assert/strict";
import test from "node:test";
import { createChatService, type ChatMessageRecord } from "../src/services/chat.service";
import { ServiceError } from "../src/services/errors";

const savedMessage: ChatMessageRecord = {
  id: "message-1",
  sessionId: "session-1",
  senderId: "user-1",
  message: "Halo!",
  sentAt: new Date("2026-10-01T00:00:00.000Z"),
  sender: { id: "user-1", name: "Alya" }
};

test("send persists a trimmed text message for a session participant", async () => {
  let saved: { sessionId: string; senderId: string; message: string } | undefined;
  const service = createChatService(
    async () => ({ id: "participant-1" }),
    async (data) => {
      saved = data;
      return savedMessage;
    }
  );

  await service.send("session-1", "user-1", "  Halo!  ");

  assert.deepEqual(saved, { sessionId: "session-1", senderId: "user-1", message: "Halo!" });
});

test("send rejects non-members and invalid text", async () => {
  let creates = 0;
  const service = createChatService(
    async () => null,
    async () => {
      creates += 1;
      return savedMessage;
    }
  );

  await assert.rejects(
    service.send("session-1", "user-2", "Halo!"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 403
  );
  await assert.rejects(
    service.send("session-1", "user-1", "   "),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 400
  );
  await assert.rejects(
    service.send("session-1", "user-1", "x".repeat(2001)),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 400
  );
  assert.equal(creates, 0);
});
