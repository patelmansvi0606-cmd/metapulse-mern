import { config, isProduction } from "./config.js";
import http from "node:http";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDb } from "@metapulse/db";
import { attachUser } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRouter } from "./routes/auth.routes.js";
import { workspaceRouter } from "./routes/workspace.routes.js";
import { briefRouter } from "./routes/brief.routes.js";
import { contentRouter } from "./routes/content.routes.js";
import { commentRouter } from "./routes/comment.routes.js";
import { attachSocketServer } from "./socket.js";
import { watchForRealtimeUpdates } from "./change-streams.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(attachUser); // best-effort: sets req.user when a valid session cookie is present, doesn't block otherwise

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/workspaces", workspaceRouter);
app.use("/api/workspaces/:workspaceId/briefs", briefRouter);
app.use("/api/workspaces/:workspaceId", contentRouter);
app.use("/api/workspaces/:workspaceId", commentRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = http.createServer(app);

async function start() {
  await connectDb(config.MONGODB_URI);

  const io = attachSocketServer(httpServer);
  watchForRealtimeUpdates(io); // needs an open Mongo connection — must come after connectDb()

  httpServer.listen(config.PORT, () => {
    console.log(
      `[api] listening on :${config.PORT} (${isProduction ? "production" : "development"})`,
    );
  });
}

start().catch((err) => {
  console.error("[api] failed to start:", err.message);
  process.exit(1);
});
