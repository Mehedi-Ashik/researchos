import express from "express";
import { createServer } from "http";
import { spawn, execSync } from "child_process";
import path from "path";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const getPythonCommand = (): string => {
  if (process.platform === "win32") {
    return "python";
  }
  try {
    execSync("command -v python3", { stdio: "ignore" });
    return "python3";
  } catch {
    return "python";
  }
};

const pythonCmd = getPythonCommand();
console.log(`[SERVER] Spawning Python FastAPI backend process using command: ${pythonCmd}`);

const pythonProcess = spawn(pythonCmd, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"], {
  cwd: path.join(process.cwd(), "fastapi-backend"),
  stdio: "inherit",
  shell: true,
});

pythonProcess.on("error", (err) => {
  console.error("[SERVER] Failed to start Python process:", err);
});

pythonProcess.on("exit", (code, signal) => {
  console.log(`[SERVER] Python FastAPI backend process exited with code ${code} and signal ${signal}`);
});

const apiProxy = createProxyMiddleware({
  target: "http://127.0.0.1:8000",
  changeOrigin: true,
  onError: (err: any, req: any, res: any) => {
    console.error("[PROXY ERROR] Failed to connect to FastAPI backend:", err.message);
    if (!res.headersSent) {
      res.status(502).json({
        detail: "FastAPI backend server is starting up or temporarily offline. Please retry in a few seconds.",
      });
    }
  },
  on: {
    error: (err: any, req: any, res: any) => {
      console.error("[PROXY ERROR] Failed to connect to FastAPI backend:", err.message);
      if (!res.headersSent) {
        res.status(502).json({
          detail: "FastAPI backend server is starting up or temporarily offline. Please retry in a few seconds.",
        });
      }
    }
  }
} as any);

app.use("/api/v1", (req: any, res: any, next: any) => {
  req.url = "/api/v1" + req.url;
  apiProxy(req, res, next);
});

const distPath = path.join(process.cwd(), "dist");
app.use(express.static(distPath));
app.get("*", (_req: any, res: any) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const server = createServer(app);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[SERVER] Node workstation running on http://0.0.0.0:${PORT}`);
});