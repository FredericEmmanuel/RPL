import assert from "node:assert/strict";
import test from "node:test";
import { createAuthService, type AuthPrisma } from "../src/services/auth.service";
import { ServiceError } from "../src/services/errors";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

function makeUser(passwordHash: string) {
  return {
    id: "user-1",
    name: "Alya Putri",
    email: "alya@example.test",
    passwordHash,
    schoolOrUniversity: null,
    favoriteSubjects: [],
    preferredLocation: null,
    createdAt
  };
}

test("register normalizes email, hashes password and returns a JWT", async () => {
  let saved: Parameters<AuthPrisma["user"]["create"]>[0]["data"] | undefined;
  const prisma: AuthPrisma = {
    user: {
      findUnique: async () => null,
      create: async ({ data }) => {
        saved = data;
        return makeUser(data.passwordHash);
      }
    }
  };
  const service = createAuthService(prisma, {
    hashPassword: async (password) => `hashed:${password}`,
    createToken: (userId) => `token:${userId}`
  });

  const result = await service.register({
    name: "Alya Putri",
    email: " ALYA@example.test ",
    password: "password-123"
  });

  assert.equal(saved?.email, "alya@example.test");
  assert.equal(saved?.passwordHash, "hashed:password-123");
  assert.equal(result.token, "token:user-1");
});

test("register rejects an email already in use", async () => {
  const prisma: AuthPrisma = {
    user: {
      findUnique: async () => makeUser("hash"),
      create: async () => {
        throw new Error("must not create duplicate user");
      }
    }
  };
  const service = createAuthService(prisma);

  await assert.rejects(
    service.register({ name: "Alya", email: "alya@example.test", password: "password-123" }),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 409
  );
});

test("login verifies the password and rejects invalid credentials", async () => {
  const prisma: AuthPrisma = {
    user: {
      findUnique: async () => makeUser("password-hash"),
      create: async () => makeUser("password-hash")
    }
  };
  const service = createAuthService(prisma, {
    comparePassword: async (password, hash) => password === "correct-password" && hash === "password-hash",
    createToken: (userId) => `token:${userId}`
  });

  assert.equal(
    (await service.login({ email: "ALYA@example.test", password: "correct-password" })).token,
    "token:user-1"
  );
  await assert.rejects(
    service.login({ email: "alya@example.test", password: "wrong-password" }),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 401
  );
});
