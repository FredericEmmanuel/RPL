import assert from "node:assert/strict";
import test from "node:test";
import { createSessionService, type SessionRecord } from "../src/services/session.service";
import { ServiceError } from "../src/services/errors";

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
    startTime: "2026-11-01T10:00:00.000Z",
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
