import assert from "node:assert/strict";
import { waitForCommand } from "../src/lib/command-lifecycle.ts";

const statuses = ["pending", "processing", "succeeded"];
const completed = await waitForCommand(
  async () => ({ status: statuses.shift() ?? "succeeded", error: null }),
  { pollIntervalMs: 0, timeoutMs: 100 },
);
assert.equal(completed.status, "succeeded");

await assert.rejects(
  waitForCommand(async () => ({ status: "failed", error: "Illegal transition" }), { pollIntervalMs: 0, timeoutMs: 100 }),
  /Illegal transition/,
);

await assert.rejects(
  waitForCommand(async () => ({ status: "pending", error: null }), { pollIntervalMs: 0, timeoutMs: 0 }),
  /timed out/,
);

console.log("verified command completion, failure, and timeout handling");
