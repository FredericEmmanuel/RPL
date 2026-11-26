import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { createToken, verifyToken } from "../src/auth";
import { createAuthService, type AuthPrisma } from "../src/services/auth.service";
import { ServiceError } from "../src/services/errors";
import { InMemoryRateLimiter } from "../src/rate-limit";

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const jwtSecret = "unit-test-jwt-secret";
process.env.JWT_SECRET = jwtSecret;

const validRegistration = {
  name: "Alya Putri",
  email: "alya@example.test",
  password: "password-123"
};

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

const invalidRegistrations: Array<[string, unknown]> = [
  ["null body", null],
  ["array body", []],
  ["empty body", {}],
  ["empty name", { ...validRegistration, name: "" }],
  ["one-character name", { ...validRegistration, name: "A" }],
  ["missing name", { email: validRegistration.email, password: validRegistration.password }],
  ["non-string name", { ...validRegistration, name: 7 }],
  ["malformed email", { ...validRegistration, email: "not-an-email" }],
  ["missing email", { name: validRegistration.name, password: validRegistration.password }],
  ["non-string email", { ...validRegistration, email: 12 }],
  ["missing password", { name: validRegistration.name, email: validRegistration.email }],
  ["empty password", { ...validRegistration, password: "" }],
  ["short password", { ...validRegistration, password: "1234567" }],
  ["non-string password", { ...validRegistration, password: 12345678 }],
  ["school exceeds maximum", { ...validRegistration, schoolOrUniversity: "x".repeat(121) }],
  ["too many favorite subjects", { ...validRegistration, favoriteSubjects: Array(21).fill("Math") }],
  ["empty favorite subject", { ...validRegistration, favoriteSubjects: [""] }],
  ["preferred location exceeds maximum", { ...validRegistration, preferredLocation: "x".repeat(121) }]
];

for (const [label, input] of invalidRegistrations) {
  test(`register rejects ${label}`, async () => {
    const prisma: AuthPrisma = {
      user: {
        findUnique: async () => null,
        create: async () => {
          throw new Error("must not create invalid registration");
        }
      }
    };
    await assert.rejects(
      createAuthService(prisma).register(input),
      (error: unknown) => error instanceof ServiceError && error.statusCode === 400
    );
  });
}

const invalidLogins: Array<[string, unknown]> = [
  ["null body", null],
  ["empty body", {}],
  ["malformed email", { email: "invalid", password: "password" }],
  ["empty password", { email: validRegistration.email, password: "" }],
  ["non-string email", { email: 1, password: "password" }],
  ["missing password", { email: validRegistration.email }]
];

for (const [label, input] of invalidLogins) {
  test(`login rejects ${label}`, async () => {
    const prisma: AuthPrisma = {
      user: {
        findUnique: async () => {
          throw new Error("must not query invalid login");
        },
        create: async () => {
          throw new Error("not used");
        }
      }
    };
    await assert.rejects(
      createAuthService(prisma).login(input),
      (error: unknown) => error instanceof ServiceError && error.statusCode === 400
    );
  });
}

test("register maps a concurrent unique-email conflict to 409", async () => {
  const prisma: AuthPrisma = {
    user: {
      findUnique: async () => null,
      create: async () => {
        throw { code: "P2002" };
      }
    }
  };
  await assert.rejects(
    createAuthService(prisma).register(validRegistration),
    (error: unknown) => error instanceof ServiceError && error.statusCode === 409
  );
});

test("register propagates password hashing failures", async () => {
  const prisma: AuthPrisma = {
    user: {
      findUnique: async () => null,
      create: async () => makeUser("hash")
    }
  };
  const service = createAuthService(prisma, {
    hashPassword: async () => {
      throw new Error("hash failed");
    }
  });
  await assert.rejects(service.register(validRegistration), /hash failed/);
});

test("register propagates non-unique database errors", async () => {
  const prisma: AuthPrisma = {
    user: {
      findUnique: async () => null,
      create: async () => {
        throw new Error("database unavailable");
      }
    }
  };
  await assert.rejects(createAuthService(prisma).register(validRegistration), /database unavailable/);
});

test("register normalizes optional profile values and stores omitted values as null", async () => {
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
  await createAuthService(prisma, { hashPassword: async () => "hash" }).register({
    ...validRegistration,
    schoolOrUniversity: "  Kampus  ",
    favoriteSubjects: [" Matematika "],
    preferredLocation: "  Bandung  "
  });
  assert.equal(saved?.schoolOrUniversity, "Kampus");
  assert.deepEqual(saved?.favoriteSubjects, ["Matematika"]);
  assert.equal(saved?.preferredLocation, "Bandung");
});

test("createToken signs a user token with a seven-day expiry", () => {
  const payload = jwt.verify(createToken("user-1"), jwtSecret) as jwt.JwtPayload;
  assert.equal(payload.userId, "user-1");
  assert.equal((payload.exp ?? 0) - (payload.iat ?? 0), 7 * 24 * 60 * 60);
});

test("verifyToken accepts a valid token and returns its user id", () => {
  assert.equal(verifyToken(createToken("user-1")), "user-1");
});

test("verifyToken rejects an expired token", () => {
  const expiredToken = jwt.sign({ userId: "user-1" }, jwtSecret, { expiresIn: -1 });
  assert.throws(() => verifyToken(expiredToken), /jwt expired/);
});

test("verifyToken rejects a token with the wrong signature", () => {
  const invalidToken = jwt.sign({ userId: "user-1" }, "different-secret");
  assert.throws(() => verifyToken(invalidToken), /invalid signature/);
});

test("verifyToken rejects malformed token text", () => {
  assert.throws(() => verifyToken("not-a-jwt"), /jwt malformed/);
});

test("verifyToken rejects a signed payload without a user id", () => {
  const tokenWithoutUser = jwt.sign({ role: "student" }, jwtSecret);
  assert.throws(() => verifyToken(tokenWithoutUser), /Sesi masuk tidak valid/);
});

test("verifyToken rejects a signed string payload", () => {
  const stringPayload = jwt.sign("user-1", jwtSecret);
  assert.throws(() => verifyToken(stringPayload), /Sesi masuk tidak valid/);
});

test("createToken fails explicitly when JWT_SECRET is missing", () => {
  const previousSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  try {
    assert.throws(() => createToken("user-1"), /JWT_SECRET belum diatur/);
  } finally {
    process.env.JWT_SECRET = previousSecret;
  }
});

test("rate limiter blocks login attempts until its window expires", () => {
  const limiter = new InMemoryRateLimiter({ limit: 2, windowMs: 1_000 });
  assert.equal(limiter.consume("login-client", 10_000), null);
  assert.equal(limiter.consume("login-client", 10_100), null);
  assert.equal(limiter.consume("login-client", 10_200), 1);
  assert.equal(limiter.consume("login-client", 11_000), null);
});

test("rate limiter keeps auth clients independent", () => {
  const limiter = new InMemoryRateLimiter({ limit: 1, windowMs: 1_000 });
  assert.equal(limiter.consume("login-client-1", 10_000), null);
  assert.equal(limiter.consume("login-client-1", 10_100), 1);
  assert.equal(limiter.consume("login-client-2", 10_100), null);
});
