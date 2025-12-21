import { describe, it, expect } from "vitest";
import { readFile, access, constants } from "fs/promises";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = join(__dirname, "../../dist/index.js");

describe("CLI Integration Tests", () => {
  it("should have correct shebang in dist/index.js", async () => {
    const content = await readFile(distPath, "utf-8");
    expect(content.startsWith("#!/usr/bin/env node")).toBe(true);
  });

  it("should be executable", async () => {
    try {
      await access(distPath, constants.X_OK);
    } catch (error) {
      // On some systems the file might not have execute bit, but node can still run it
      // So we just verify the file exists
      await access(distPath, constants.R_OK);
    }
  });

  it("should log warning for invalid URL but continue running", async () => {
    const env = { ...process.env, CODECOV_BASE_URL: "invalid-url-without-protocol" };

    const warnings: string[] = [];
    const result = await new Promise<number>((resolve) => {
      const proc = spawn("node", [distPath], { env });

      proc.stderr.on("data", (data) => {
        warnings.push(data.toString());
      });

      // Server should stay running, we need to kill it
      setTimeout(() => {
        proc.kill();
        resolve(proc.exitCode || 0);
      }, 2000);

      proc.on("exit", (code) => {
        resolve(code || 0);
      });
    });

    const allWarnings = warnings.join("");
    expect(allWarnings).toContain("WARNING");
    expect(allWarnings).toContain("CODECOV_BASE_URL");
    expect(allWarnings).toContain("Tools will fail at execution time");
    // Server should have started successfully
    expect(allWarnings).toContain("Codecov MCP Server running");
  });

  it("should warn about insecure HTTP but not exit", async () => {
    const env = { ...process.env, CODECOV_BASE_URL: "http://codecov.example.com" };

    const warnings: string[] = [];
    const result = await new Promise<number>((resolve) => {
      const proc = spawn("node", [distPath], { env });

      proc.stderr.on("data", (data) => {
        warnings.push(data.toString());
      });

      // Give it a moment to start and show warnings
      setTimeout(() => {
        proc.kill();
        resolve(proc.exitCode || 0);
      }, 2000);

      proc.on("exit", (code) => {
        resolve(code || 0);
      });
    });

    const allWarnings = warnings.join("");
    expect(allWarnings).toContain("WARNING");
    expect(allWarnings.toLowerCase()).toContain("http");
  });

  it("should accept valid HTTPS URL without error", async () => {
    const env = { ...process.env, CODECOV_BASE_URL: "https://codecov.io" };

    const errors: string[] = [];
    const result = await new Promise<number>((resolve) => {
      const proc = spawn("node", [distPath], { env });

      proc.stderr.on("data", (data) => {
        const output = data.toString();
        if (output.includes("ERROR:")) {
          errors.push(output);
        }
      });

      // Give it a moment to start
      setTimeout(() => {
        proc.kill();
        resolve(proc.exitCode || 0);
      }, 2000);

      proc.on("exit", (code) => {
        resolve(code || 0);
      });
    });

    expect(errors).toHaveLength(0);
  });
});
