import express from "express";
import path from "path";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", javaVersion: "17.0.20.1" });
  });

  // Execute real Java code via child_process
  app.all("/api/run-java", (req, res) => {
    exec("java -cp sparq-prototype/bin com.sparq.demo.Main", { timeout: 15000 }, (error, stdout, stderr) => {
      if (error && !stdout) {
        return res.status(500).json({
          success: false,
          error: error.message,
          stderr,
        });
      }
      res.json({
        success: true,
        output: stdout,
        stderr: stderr || null,
        exitCode: error ? error.code : 0,
      });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SPARQ Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
