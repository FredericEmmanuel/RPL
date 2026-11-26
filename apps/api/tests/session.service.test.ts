import assert from "node:assert/strict";
import test from "node:test";
import {
  assertFutureStartTime,
  assertSessionCreator,
  createSessionService,
  type SessionRecord
} from "../src/services/session.service";
import { ServiceError } from "../src/services/errors";

const futureStartTime = new Date(Date.now() + 86_400_000).toISOString();

function sessionRecord(): SessionRecord {
  return {
    id: "session-1",
    creatorId: "user-1",
    title: "Belajar Aljabar",
    subject: "Matematika",
    startTime: new Date("2026-11-01T10:00:00.000Z"),
    location: "Perpustakaan",
    capacity: 4,
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    creator: { id: "user-1", name: "Alya" },
    participants: [],
    _count: { participants: 0 }
  };
}

test("create stores required session fields and includes its creator as a participant", async () => {
  let saved: Parameters<Parameters<typeof createSessionService>[0]>[0] | undefined;
  const service = createSessionService(async (data) => {
    saved = data;
    return sessionRecord();
  });

  await service.create("user-1", {
    title: "  Belajar Aljabar ",
    subject: " Matematika ",
    startTime: futureStartTime,
    location: "Perpustakaan",
    capacity: 4
  });

  assert.equal(saved?.title, "Belajar Aljabar");
  assert.equal(saved?.subject, "Matematika");
  assert.ok(saved?.startTime instanceof Date);
  assert.equal(saved?.location, "Perpustakaan");
  assert.equal(saved?.capacity, 4);
  assert.deepEqual(saved?.participants, { create: { userId: "user-1" } });
});

test("create rejects missing or invalid required fields", async () => {
  const service = createSessionService(async () => sessionRecord());

  await assert.rejects(
    service.create("user-1", { title: "No subject" }),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 400
  );
});

test("create rejects a session that starts in the past", async () => {
  const service = createSessionService(async () => sessionRecord());

  await assert.rejects(
    service.create("user-1", {
      title: "Belajar Aljabar",
      subject: "Matematika",
      startTime: "2020-01-01T10:00:00.000Z",
      location: "Perpustakaan",
      capacity: 4
    }),
    (error: unknown) =>
      error instanceof ServiceError &&
      error.statusCode === 400 &&
      error.message === "Waktu mulai sesi harus berada di masa depan."
  );
});

test("create rejects capacity below two participants", async () => {
  const service = createSessionService(async () => sessionRecord());

  await assert.rejects(
    service.create("user-1", {
      title: "Belajar Aljabar",
      subject: "Matematika",
      startTime: futureStartTime,
      location: "Perpustakaan",
      capacity: 1
    }),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 400
  );
});

const validInput = {
  title: "Belajar Aljabar",
  subject: "Matematika",
  startTime: futureStartTime,
  location: "Perpustakaan",
  capacity: 4
};

for (const capacity of [2, 100]) {
  test(`create accepts boundary capacity ${capacity}`, async () => {
    let savedCapacity: number | undefined;
    const service = createSessionService(async (data) => {
      savedCapacity = data.capacity;
      return sessionRecord();
    });
    await service.create("user-1", { ...validInput, capacity });
    assert.equal(savedCapacity, capacity);
  });
}

for (const capacity of [0, 1.5, 101, Number.NaN, Number.POSITIVE_INFINITY]) {
  test(`create rejects invalid capacity ${String(capacity)}`, async () => {
    const service = createSessionService(async () => sessionRecord());
    await assert.rejects(
      service.create("user-1", { ...validInput, capacity }),
      (error: unknown) => error instanceof ServiceError && error.statusCode === 400
    );
  });
}

const invalidSessions: Array<[string, unknown]> = [
  ["null body", null],
  ["array body", []],
  ["empty title", { ...validInput, title: "" }],
  ["short title", { ...validInput, title: "AB" }],
  ["overlong title", { ...validInput, title: "x".repeat(121) }],
  ["non-string title", { ...validInput, title: 12 }],
  ["empty subject", { ...validInput, subject: "" }],
  ["overlong subject", { ...validInput, subject: "x".repeat(81) }],
  ["non-string subject", { ...validInput, subject: false }],
  ["missing start time", { title: validInput.title, subject: validInput.subject, location: validInput.location, capacity: 4 }],
  ["invalid start time", { ...validInput, startTime: "tomorrow" }],
  ["non-string start time", { ...validInput, startTime: Date.now() }],
  ["missing location", { ...validInput, location: undefined }],
  ["empty location", { ...validInput, location: "" }],
  ["one-character location", { ...validInput, location: "X" }],
  ["overlong location", { ...validInput, location: "x".repeat(161) }],
  ["non-string location", { ...validInput, location: 42 }],
  ["missing capacity", { ...validInput, capacity: undefined }],
  ["string capacity", { ...validInput, capacity: "4" }],
  ["null capacity", { ...validInput, capacity: null }],
  ["empty subject whitespace", { ...validInput, subject: "   " }],
  ["empty location whitespace", { ...validInput, location: "   " }]
];

for (const [label, input] of invalidSessions) {
  test(`create rejects ${label}`, async () => {
    const service = createSessionService(async () => sessionRecord());
    await assert.rejects(
      service.create("user-1", input),
      (error: unknown) => error instanceof ServiceError && error.statusCode === 400
    );
  });
}

test("assertSessionCreator permits the owner", () => {
  assert.doesNotThrow(() => assertSessionCreator({ creatorId: "owner-1" }, "owner-1"));
});

test("assertSessionCreator rejects a non-owner", () => {
  assert.throws(
    () => assertSessionCreator({ creatorId: "owner-1" }, "other-user"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 403
  );
});

test("assertSessionCreator rejects a missing session", () => {
  assert.throws(
    () => assertSessionCreator(null, "owner-1"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 404
  );
});

test("create propagates persistence errors", async () => {
  const service = createSessionService(async () => {
    throw new Error("database unavailable");
  });
  await assert.rejects(service.create("user-1", validInput), /database unavailable/);
});

test("create accepts a start time one minute in the future", async () => {
  const startTime = new Date(Date.now() + 60_000).toISOString();
  const service = createSessionService(async () => sessionRecord());
  await assert.doesNotReject(service.create("user-1", { ...validInput, startTime }));
});

test("assertFutureStartTime rejects the current instant", () => {
  assert.throws(
    () => assertFutureStartTime(new Date(Date.now() - 1).toISOString()),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 400
  );
});

test("create trims title and location at their minimum valid lengths", async () => {
  let saved: Parameters<Parameters<typeof createSessionService>[0]>[0] | undefined;
  const service = createSessionService(async (data) => {
    saved = data;
    return sessionRecord();
  });
  await service.create("user-1", { ...validInput, title: "  ABC  ", subject: " M ", location: " XY " });
  assert.equal(saved?.title, "ABC");
  assert.equal(saved?.subject, "M");
  assert.equal(saved?.location, "XY");
});

test("create accepts the maximum title length", async () => {
  const service = createSessionService(async () => sessionRecord());
  await assert.doesNotReject(service.create("user-1", { ...validInput, title: "x".repeat(120) }));
});

test("create accepts the maximum subject length", async () => {
  const service = createSessionService(async () => sessionRecord());
  await assert.doesNotReject(service.create("user-1", { ...validInput, subject: "x".repeat(80) }));
});

test("create accepts the maximum location length", async () => {
  const service = createSessionService(async () => sessionRecord());
  await assert.doesNotReject(service.create("user-1", { ...validInput, location: "x".repeat(160) }));
});

test("create accepts an ISO timestamp with an explicit timezone offset", async () => {
  const service = createSessionService(async () => sessionRecord());
  await assert.doesNotReject(
    service.create("user-1", { ...validInput, startTime: new Date(Date.now() + 60_000).toISOString() })
  );
});

test("assertFutureStartTime accepts a future timestamp", () => {
  assert.doesNotThrow(() => assertFutureStartTime(new Date(Date.now() + 1_000).toISOString()));
});
