export type CommandStatusResponse = {
  status: "pending" | "processing" | "succeeded" | "failed";
  error: string | null;
};

type WaitForCommandOptions = {
  pollIntervalMs?: number;
  timeoutMs?: number;
};

const sleep = (durationMs: number) => new Promise((resolve) => setTimeout(resolve, durationMs));

export async function waitForCommand(
  getStatus: () => Promise<CommandStatusResponse>,
  { pollIntervalMs = 300, timeoutMs = 20_000 }: WaitForCommandOptions = {},
) {
  const deadline = Date.now() + timeoutMs;

  do {
    const command = await getStatus();
    if (command.status === "succeeded") return command;
    if (command.status === "failed") throw new Error(command.error || "Command failed");
    await sleep(pollIntervalMs);
  } while (Date.now() <= deadline);

  throw new Error("Command processing timed out");
}
