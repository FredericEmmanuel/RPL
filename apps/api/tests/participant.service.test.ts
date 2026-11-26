import assert from "node:assert/strict";
import test from "node:test";
import { createParticipantService, type ParticipantPrisma } from "../src/services/participant.service";
import { ServiceError } from "../src/services/errors";

function makePrisma(input: {
  participantCount: number;
  capacity: number;
  existingParticipant?: boolean;
  sessionExists?: boolean;
  transactionError?: Error;
  createError?: Error;
  creatorId?: string;
}) {
  let created = 0;
  let deleted = 0;
  let isolationLevel: string | undefined;
  const prisma: ParticipantPrisma = {
    $transaction: async (operation, options) => {
      isolationLevel = options.isolationLevel;
      if (input.transactionError) {
        throw input.transactionError;
      }
      return operation({
        studySession: {
          findUnique: async () =>
            input.sessionExists === false
              ? null
              : {
                  capacity: input.capacity,
                  creatorId: input.creatorId ?? "creator-1",
                  _count: { participants: input.participantCount }
                }
        },
        sessionParticipant: {
          findUnique: async () => (input.existingParticipant ? { id: "participant-1" } : null),
          create: async () => {
            if (input.createError) {
              throw input.createError;
            }
            created += 1;
            return { id: "participant-2" };
          },
          delete: async () => {
            deleted += 1;
            return { id: "participant-1" };
          }
        }
      });
    }
  };
  return {
    prisma,
    getCreated: () => created,
    getDeleted: () => deleted,
    getIsolationLevel: () => isolationLevel
  };
}

test("join adds a participant when capacity is available", async () => {
  const { prisma, getCreated } = makePrisma({ participantCount: 1, capacity: 3 });

  await createParticipantService(prisma).join("session-1", "user-2");

  assert.equal(getCreated(), 1);
});

test("join rejects a full session and duplicate participation", async () => {
  const full = makePrisma({ participantCount: 3, capacity: 3 });
  await assert.rejects(
    createParticipantService(full.prisma).join("session-1", "user-2"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 409
  );
  assert.equal(full.getCreated(), 0);

  const duplicate = makePrisma({ participantCount: 1, capacity: 3, existingParticipant: true });
  await assert.rejects(
    createParticipantService(duplicate.prisma).join("session-1", "user-2"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 409
  );
  assert.equal(duplicate.getCreated(), 0);
});

test("leave removes an existing participant", async () => {
  const { prisma, getDeleted } = makePrisma({
    participantCount: 2,
    capacity: 4,
    existingParticipant: true
  });

  await createParticipantService(prisma).leave("session-1", "user-2");

  assert.equal(getDeleted(), 1);
});

test("join rejects a session that does not exist", async () => {
  const { prisma } = makePrisma({ participantCount: 0, capacity: 2, sessionExists: false });
  await assert.rejects(
    createParticipantService(prisma).join("missing", "user-2"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 404
  );
});

for (const participantCount of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) {
  test(`join rejects a full session with ${participantCount} current participants`, async () => {
    const { prisma, getCreated } = makePrisma({ participantCount, capacity: participantCount });
    await assert.rejects(
      createParticipantService(prisma).join("session-1", "user-2"),
      (error: unknown) => error instanceof ServiceError && error.statusCode === 409
    );
    assert.equal(getCreated(), 0);
  });
}

for (const participantCount of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  test(`join rejects an existing participant at count ${participantCount}`, async () => {
    const { prisma, getCreated } = makePrisma({
      participantCount,
      capacity: participantCount + 2,
      existingParticipant: true
    });
    await assert.rejects(
      createParticipantService(prisma).join("session-1", "user-2"),
      (error: unknown) => error instanceof ServiceError && error.statusCode === 409
    );
    assert.equal(getCreated(), 0);
  });
}

test("join uses serializable isolation for capacity checks", async () => {
  const { prisma, getIsolationLevel } = makePrisma({ participantCount: 1, capacity: 2 });
  await createParticipantService(prisma).join("session-1", "user-2");
  assert.equal(getIsolationLevel(), "Serializable");
});

test("join maps a concurrent unique-key conflict to duplicate participation", async () => {
  const { prisma } = makePrisma({
    participantCount: 1,
    capacity: 3,
    createError: Object.assign(new Error("unique conflict"), { code: "P2002" })
  });
  await assert.rejects(
    createParticipantService(prisma).join("session-1", "user-2"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 409
  );
});

test("join propagates serializable transaction conflicts for the route to handle", async () => {
  const conflict = Object.assign(new Error("serialization conflict"), { code: "P2034" });
  const { prisma } = makePrisma({ participantCount: 1, capacity: 2, transactionError: conflict });
  await assert.rejects(
    createParticipantService(prisma).join("session-1", "user-2"),
    (error: unknown) => error === conflict
  );
});

test("join propagates unrelated database errors", async () => {
  const { prisma } = makePrisma({
    participantCount: 1,
    capacity: 2,
    createError: new Error("database unavailable")
  });
  await assert.rejects(createParticipantService(prisma).join("session-1", "user-2"), /database unavailable/);
});

test("leave rejects a missing session", async () => {
  const { prisma } = makePrisma({ participantCount: 0, capacity: 2, sessionExists: false });
  await assert.rejects(
    createParticipantService(prisma).leave("missing", "user-2"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 404
  );
});

test("leave prevents a creator from leaving their own session", async () => {
  const { prisma, getDeleted } = makePrisma({
    participantCount: 1,
    capacity: 2,
    existingParticipant: true,
    creatorId: "creator-1"
  });
  await assert.rejects(
    createParticipantService(prisma).leave("session-1", "creator-1"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 409
  );
  assert.equal(getDeleted(), 0);
});

test("leave rejects a user who is not a participant", async () => {
  const { prisma, getDeleted } = makePrisma({ participantCount: 1, capacity: 2 });
  await assert.rejects(
    createParticipantService(prisma).leave("session-1", "user-2"),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 404
  );
  assert.equal(getDeleted(), 0);
});

test("leave uses serializable isolation", async () => {
  const { prisma, getIsolationLevel } = makePrisma({
    participantCount: 2,
    capacity: 3,
    existingParticipant: true
  });
  await createParticipantService(prisma).leave("session-1", "user-2");
  assert.equal(getIsolationLevel(), "Serializable");
});

for (const participantCount of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  test(`join permits an available seat with ${participantCount} current participants`, async () => {
    const { prisma, getCreated } = makePrisma({
      participantCount,
      capacity: participantCount + 1
    });
    await createParticipantService(prisma).join("session-1", "user-2");
    assert.equal(getCreated(), 1);
  });
}
