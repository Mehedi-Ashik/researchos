import express from "express";
import path from "path";
import { spawn } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Spawning Python FastAPI Server in the background
console.log("[SERVER] Spawning Python FastAPI backend process...");
const fastapiPath = path.join(process.cwd(), "fastapi-backend");

const pythonProcess = spawn(
  "python",
  ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
  {
    cwd: fastapiPath,
    env: { ...process.env },
  }
);

pythonProcess.stdout.on("data", (data) => {
  console.log(`[FASTAPI] ${data.toString().trim()}`);
});

pythonProcess.stderr.on("data", (data) => {
  console.error(`[FASTAPI-ERROR] ${data.toString().trim()}`);
});

pythonProcess.on("close", (code) => {
  console.log(`[SERVER] FastAPI process exited with code ${code}`);
});

// Clean up Python process on Node exit
process.on("exit", () => {
  pythonProcess.kill();
});
process.on("SIGINT", () => {
  pythonProcess.kill();
  process.exit();
});
process.on("SIGTERM", () => {
  pythonProcess.kill();
  process.exit();
});

// 2. Proxy middleware for forwarding API calls to Python backend
const apiProxy = createProxyMiddleware({
  target: "http://127.0.0.1:8000",
  changeOrigin: true,
  ws: true,
  onError: (err, req, res) => {
    console.error("[PROXY ERROR] Failed to connect to FastAPI backend:", err.message);
    res.status(502).json({
      detail: "FastAPI backend server is starting up or temporarily offline. Please retry in a few seconds.",
    });
  },
} as any);

// Mount proxy to /api and /v1 (compatibility)
app.use("/api/v1", (req: any, res: any, next: any) => { req.url = "/api/v1" + req.url; apiProxy(req, res, next); });



// 3. Vite Server or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Booting in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Booting in PRODUCTION mode serving built assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Node workstation running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
