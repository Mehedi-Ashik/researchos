import express from "express";
import { createServer } from "http";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const pythonProcess = spawn("python", ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"], {
  cwd: path.join(__dirname, "fastapi-backend"),
  stdio: "inherit",
  shell: true,
});

pythonProcess.on("error", (err) => {
  console.error("[SERVER] Failed to start Python process:", err);
});

const apiProxy = createProxyMiddleware({
  target: "http://127.0.0.1:8000",
  changeOrigin: true,
});

app.use("/api/v1", (req: any, res: any, next: any) => {
  req.url = "/api/v1" + req.url;
  apiProxy(req, res, next);
});

const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const server = createServer(app);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[SERVER] Node workstation running on http://0.0.0.0:${PORT}`);
});