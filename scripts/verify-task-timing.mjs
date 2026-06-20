import assert from "node:assert/strict";
import { formatTaskTiming } from "../src/lib/task-timing.ts";

const baseTask = {
  state: "READY",
  scheduledStart: null,
  earliestStart: null,
  estimatedDurationHours: 2,
};

assert.equal(formatTaskTiming(baseTask), "Est. duration 2h");
assert.equal(formatTaskTiming({ ...baseTask, estimatedDurationHours: 1.5 }), "Est. duration 1.5h");
assert.match(formatTaskTiming({ ...baseTask, earliestStart: "2026-06-21T09:00:00.000Z" }), /^ETA /);
assert.equal(formatTaskTiming({ ...baseTask, state: "COMPLETE" }), "Completed");
assert.equal(formatTaskTiming({ ...baseTask, state: "FAILED" }), "Failed");

console.log("verified task timing labels");
