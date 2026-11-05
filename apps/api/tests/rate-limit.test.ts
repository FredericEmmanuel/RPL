import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryRateLimiter } from "../src/rate-limit";

test("rate limiter blocks requests over the limit until the window expires", () => {
  const limiter = new InMemoryRateLimiter({ limit: 2, windowMs: 1_000 });

  assert.equal(limiter.consume("client-1", 10_000), null);
  assert.equal(limiter.consume("client-1", 10_100), null);
  assert.equal(limiter.consume("client-1", 10_200), 1);
  assert.equal(limiter.consume("client-1", 11_000), null);
});

test("rate limiter tracks clients independently", () => {
  const limiter = new InMemoryRateLimiter({ limit: 1, windowMs: 1_000 });

  assert.equal(limiter.consume("client-1", 10_000), null);
  assert.equal(limiter.consume("client-1", 10_100), 1);
  assert.equal(limiter.consume("client-2", 10_100), null);
});
