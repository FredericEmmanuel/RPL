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
  assert.deepEqual(
    {
      subject: query?.subject,
      location: query?.location
    },
    {
      subject: { equals: "Matematika", mode: "insensitive" },
      location: { contains: "UI", mode: "insensitive" }
    }
  );
  assert.ok(query?.startTime && "gte" in query.startTime);
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

const subjectQueries = [
  "Matematika",
  "matematika",
  "Fisika",
  "Kimia",
  "Biologi",
  "Sejarah",
  "Bahasa Indonesia",
  "Ekonomi",
  "Kalkulus",
  "  Matematika  "
];

for (const subject of subjectQueries) {
  test(`search filters subject ${JSON.stringify(subject)} case-insensitively`, async () => {
    let query: Prisma.StudySessionWhereInput | undefined;
    await createExploreService(async (where) => {
      query = where;
      return [];
    }).search({ subject });
    assert.deepEqual(query?.subject, {
      equals: subject.trim(),
      mode: "insensitive"
    });
  });
}

const locationQueries = [
  "UI",
  "ui",
  "Bandung",
  "Jakarta",
  "Surabaya",
  "Perpustakaan",
  "Kampus A",
  "room 101",
  "  Depok  ",
  "BANDUNG"
];

for (const location of locationQueries) {
  test(`search filters location ${JSON.stringify(location)} case-insensitively`, async () => {
    let query: Prisma.StudySessionWhereInput | undefined;
    await createExploreService(async (where) => {
      query = where;
      return [];
    }).search({ location });
    assert.deepEqual(query?.location, {
      contains: location.trim(),
      mode: "insensitive"
    });
  });
}

const keywords = [
  "aljabar",
  "Fisika",
  "UI",
  "kelompok",
  "  kalkulus ",
  "Biologi",
  "Jakarta",
  "Belajar",
  "",
  "   "
];

for (const search of keywords) {
  test(`search keyword ${JSON.stringify(search)} ${search.trim() ? "creates" : "omits"} text filters`, async () => {
    let query: Prisma.StudySessionWhereInput | undefined;
    await createExploreService(async (where) => {
      query = where;
      return [];
    }).search({ search });
    if (!search.trim()) {
      assert.equal(query?.OR, undefined);
      return;
    }
    assert.deepEqual(query?.OR, [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { subject: { contains: search.trim(), mode: "insensitive" } },
      { location: { contains: search.trim(), mode: "insensitive" } }
    ]);
  });
}

for (const filters of [
  { subject: " ", location: " ", search: " " },
  { subject: "", location: "", search: "" },
  {}
]) {
  test(`search omits empty filter values ${JSON.stringify(filters)}`, async () => {
    let query: Prisma.StudySessionWhereInput | undefined;
    await createExploreService(async (where) => {
      query = where;
      return [];
    }).search(filters);
    assert.equal(query?.subject, undefined);
    assert.equal(query?.location, undefined);
    assert.equal(query?.OR, undefined);
  });
}
