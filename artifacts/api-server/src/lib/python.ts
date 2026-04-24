import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PYTHON = "/home/runner/workspace/.pythonlibs/bin/python3";

const SCRIPTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "python",
);
// In dev: dist/ -> ../python -> artifacts/api-server/python/
// This path is correct: Python scripts live at artifacts/api-server/python/

export function runPython(script: string, input: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(SCRIPTS_DIR, script);
    const proc = spawn(PYTHON, [scriptPath]);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      if (code !== 0 && stdout.trim() === "") {
        reject(new Error(stderr || `Python exited with code ${code}`));
        return;
      }
      try {
        const result = JSON.parse(stdout.trim());
        if (result && typeof result === "object" && "error" in result) {
          reject(new Error((result as { error: string }).error));
        } else {
          resolve(result);
        }
      } catch {
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });
    proc.on("error", (err) => reject(err));

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}
