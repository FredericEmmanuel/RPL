import assert from "node:assert/strict";
import test from "node:test";
import { createParticipantService, type ParticipantPrisma } from "../src/services/participant.service";
import { ServiceError } from "../src/services/errors";

function makePrisma(input: {
  participantCount: number;
  capacity: number;
  existingParticipant?: boolean;
  sessionExists?: boolean;
}) {
  let created = 0;
  const prisma: ParticipantPrisma = {
    $transaction: async (operation) =>
      operation({
        studySession: {
          findUnique: async () =>
            input.sessionExists === false
              ? null
              : { capacity: input.capacity, _count: { participants: input.participantCount } }
        },
        sessionParticipant: {
          findUnique: async () => (input.existingParticipant ? { id: "participant-1" } : null),
          create: async () => {
            created += 1;
            return { id: "participant-2" };
          }
        }
      })
  };
  return { prisma, getCreated: () => created };
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
