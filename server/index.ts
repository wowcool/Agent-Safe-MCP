import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const SITE_PASSWORD = process.env.SITE_PASSWORD || "mcp";
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/mcp") || req.path.startsWith("/api/stripe-webhook")) {
    return next();
  }

  if (req.query.pw === SITE_PASSWORD) {
    res.cookie("site_auth", "1", { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    url.searchParams.delete("pw");
    return res.redirect(url.pathname + url.search);
  }

  if (req.cookies?.site_auth === "1") {
    return next();
  }

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.setHeader("Content-Type", "text/html");
  return res.send(`<!DOCTYPE html>
<html><head><title>Agent Safe</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;color:#fff;font-family:'Space Grotesk',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
form{text-align:center}h1{font-size:1.5rem;margin-bottom:1.5rem}input{background:#111;border:1px solid #333;color:#fff;padding:10px 16px;border-radius:6px;font-size:1rem;margin-right:8px}
button{background:#106af3;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:1rem;cursor:pointer}button:hover{opacity:0.9}.err{color:#f44;margin-top:1rem;font-size:0.875rem}</style>
</head><body><form method="GET"><h1>Enter Password</h1><div><input name="pw" type="password" placeholder="Password" autofocus /><button type="submit">Enter</button></div></form></body></html>`);
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
