import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = realpathSync(dirname(dirname(fileURLToPath(import.meta.url))));
const lockId = createHash("sha256").update(apiRoot).digest("hex").slice(0, 16);
const lockPath = join(tmpdir(), `stu-api-dev-${lockId}.lock`);
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

let activeChild;
let ownsLock = false;
let stopping = false;

function errorCode(error) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return error.code;
  }

  return undefined;
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return errorCode(error) === "EPERM";
  }
}

function readLockOwner() {
  try {
    const pid = Number.parseInt(readFileSync(lockPath, "utf8").trim(), 10);
    return Number.isSafeInteger(pid) && pid > 0 ? pid : undefined;
  } catch (error) {
    if (errorCode(error) === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

function removeLock() {
  try {
    unlinkSync(lockPath);
  } catch (error) {
    if (errorCode(error) !== "ENOENT") {
      throw error;
    }
  }
}

function acquireLock() {
  while (!ownsLock) {
    try {
      writeFileSync(lockPath, `${process.pid}\n`, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600,
      });
      ownsLock = true;
    } catch (error) {
      if (errorCode(error) !== "EEXIST") {
        throw error;
      }

      const ownerPid = readLockOwner();
      if (ownerPid && isProcessRunning(ownerPid)) {
        throw new Error(
          `API dev watcher is already running (PID ${ownerPid}). Stop it before starting another API dev command.`,
        );
      }

      removeLock();
    }
  }
}

function releaseLock() {
  if (!ownsLock || readLockOwner() !== process.pid) {
    return;
  }

  removeLock();
  ownsLock = false;
}

function runPnpm(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(pnpmCommand, args, {
      cwd: apiRoot,
      env: process.env,
      stdio: "inherit",
    });
    activeChild = child;

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (activeChild === child) {
        activeChild = undefined;
      }
      resolve({ code, signal });
    });
  });
}

function forwardSignal(signal) {
  if (stopping) {
    return;
  }

  stopping = true;
  if (activeChild && activeChild.exitCode === null) {
    activeChild.kill(signal);
    return;
  }

  releaseLock();
  process.exit(0);
}

process.once("SIGINT", () => forwardSignal("SIGINT"));
process.once("SIGTERM", () => forwardSignal("SIGTERM"));
process.once("exit", releaseLock);

try {
  acquireLock();

  const generateResult = await runPnpm(["exec", "prisma", "generate"]);
  if (generateResult.code !== 0) {
    process.exitCode = stopping ? 0 : (generateResult.code ?? 1);
  } else if (!stopping) {
    const watchResult = await runPnpm([
      "exec",
      "nest",
      "start",
      "--watch",
      "--path",
      "tsconfig.dev.json",
    ]);
    process.exitCode = stopping ? 0 : (watchResult.code ?? 1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  releaseLock();
}
