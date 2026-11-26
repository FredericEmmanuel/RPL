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
    },
    async () => []
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
    },
    async () => []
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

test("send rejects executable HTML and event-handler content", async () => {
  const service = createChatService(
    async () => ({ id: "participant-1" }),
    async (data) => ({ ...savedMessage, ...data }),
    async () => []
  );

  await assert.rejects(
    service.send("session-1", "user-1", '<img src=x onerror="alert(1)">'),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 400
  );
  await assert.rejects(
    service.send("session-1", "user-1", '<script>alert("xss")</script>'),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 400
  );
});

test("list returns messages to a registered session participant", async () => {
  let queriedSessionId: string | undefined;
  const service = createChatService(
    async (sessionId, userId) => sessionId === "session-1" && userId === "user-1" ? { id: "participant-1" } : null,
    async () => savedMessage,
    async (sessionId) => {
      queriedSessionId = sessionId;
      return [savedMessage];
    }
  );
  assert.deepEqual(await service.list("session-1", "user-1"), [savedMessage]);
  assert.equal(queriedSessionId, "session-1");
});

test("list denies non-members before querying messages", async () => {
  let queried = false;
  const service = createChatService(
    async () => null,
    async () => savedMessage,
    async () => {
      queried = true;
      return [];
    }
  );
  await assert.rejects(
    service.list("session-1", "outsider"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 403
  );
  assert.equal(queried, false);
});

test("list propagates membership lookup failures", async () => {
  const service = createChatService(
    async () => {
      throw new Error("membership lookup failed");
    },
    async () => savedMessage,
    async () => []
  );
  await assert.rejects(service.list("session-1", "user-1"), /membership lookup failed/);
});

test("list propagates message query failures", async () => {
  const service = createChatService(
    async () => ({ id: "participant-1" }),
    async () => savedMessage,
    async () => {
      throw new Error("message query failed");
    }
  );
  await assert.rejects(service.list("session-1", "user-1"), /message query failed/);
});

test("send accepts a one-character plain-text message", async () => {
  let storedMessage = "";
  const service = createChatService(
    async () => ({ id: "participant-1" }),
    async (data) => {
      storedMessage = data.message;
      return { ...savedMessage, ...data };
    },
    async () => []
  );
  await service.send("session-1", "user-1", "x");
  assert.equal(storedMessage, "x");
});

test("send accepts the 2000-character message limit", async () => {
  let storedMessage = "";
  const message = "a".repeat(2000);
  const service = createChatService(
    async () => ({ id: "participant-1" }),
    async (data) => {
      storedMessage = data.message;
      return { ...savedMessage, ...data };
    },
    async () => []
  );
  await service.send("session-1", "user-1", message);
  assert.equal(storedMessage.length, 2000);
});

for (const message of [
  "Diskusi matematika",
  "2 < 3",
  "A & B",
  "Bahasa Indonesia",
  "こんにちは",
  "مرحبا",
  "Belajar\nbersama",
  "Halo 👋"
]) {
  test(`send accepts safe plain text ${JSON.stringify(message)}`, async () => {
    let storedMessage = "";
    const service = createChatService(
      async () => ({ id: "participant-1" }),
      async (data) => {
        storedMessage = data.message;
        return { ...savedMessage, ...data };
      },
      async () => []
    );
    await service.send("session-1", "user-1", message);
    assert.equal(storedMessage, message);
  });
}

for (const message of [
  "<svg/onload=alert(1)>",
  '<img src=x onerror="alert(1)">',
  "<iframe src=x></iframe>",
  "<object data=x></object>",
  "<embed src=x>",
  "<style>body{display:none}</style>",
  '<div onfocus="alert(1)">x</div>',
  '<a href="javascript:alert(1)">x</a>',
  '<video oncanplay="alert(1)"></video>',
  '<input autofocus onfocus=alert(1)>',
  "<script>alert(1)</script>",
  "<svg><foreignObject></foreignObject></svg>"
]) {
  test(`send rejects executable markup ${message.slice(0, 30)}`, async () => {
    const service = createChatService(
      async () => ({ id: "participant-1" }),
      async (data) => ({ ...savedMessage, ...data }),
      async () => []
    );
    await assert.rejects(
      service.send("session-1", "user-1", message),
      (error: unknown) => error instanceof ServiceError && error.statusCode === 400
    );
  });
}

for (const input of [undefined, null, 123, [], {}]) {
  test(`send rejects non-string message input ${String(input)}`, async () => {
    const service = createChatService(
      async () => ({ id: "participant-1" }),
      async () => savedMessage,
      async () => []
    );
    await assert.rejects(
      service.send("session-1", "user-1", input),
      (error: unknown) => error instanceof ServiceError && error.statusCode === 400
    );
  });
}

test("send rejects whitespace-only newline messages", async () => {
  const service = createChatService(
    async () => ({ id: "participant-1" }),
    async () => savedMessage,
    async () => []
  );
  await assert.rejects(
    service.send("session-1", "user-1", " \t\n "),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 400
  );
});
