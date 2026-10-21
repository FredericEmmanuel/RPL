import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@prisma/client";
import { createExploreService } from "../src/services/explore.service";
import type { SessionRecord } from "../src/services/session.service";

const sessions: SessionRecord[] = [{
  id: "session-1",
  creatorId: "user-1",
  title: "Aljabar",
  subject: "Matematika",
  startTime: new Date("2026-11-01T10:00:00.000Z"),
  location: "Perpustakaan UI",
  capacity: 4,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  creator: { id: "user-1", name: "Alya" },
  participants: [],
  _count: { participants: 0 }
}];

test("search applies case-insensitive subject and location filters", async () => {
  let query: Prisma.StudySessionWhereInput | undefined;
  const service = createExploreService(async (where) => {
    query = where;
    return sessions;
  });

  assert.deepEqual(
    await service.search({ subject: " Matematika ", location: " UI " }),
    sessions
  );
  assert.deepEqual(query, {
    subject: { equals: "Matematika", mode: "insensitive" },
    location: { contains: "UI", mode: "insensitive" }
  });
});

test("search combines free-text search with explicit filters", async () => {
  let query: Prisma.StudySessionWhereInput | undefined;
  const service = createExploreService(async (where) => {
    query = where;
    return [];
  });

  await service.search({ subject: "Fisika", search: "kalkulus" });

  assert.equal(query?.subject && "equals" in query.subject && query.subject.equals, "Fisika");
  assert.ok(query?.OR);
});
