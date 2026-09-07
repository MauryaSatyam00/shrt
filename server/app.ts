import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.js";
import { linksRouter } from "./routes/links.js";
import { redirectRouter } from "./routes/redirect.js";
import { errorHandler } from "./middleware/error.js";

export const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true }));
app.use(express.json({ limit: "16kb" }));

app.get("/healthz", (_req, res) => res.json({ ok: true, board: "SHRT.BBS", ts: new Date().toISOString() }));
app.use("/api/auth", authRouter);
app.use("/api/links", linksRouter);
app.use("/api", (_req, res) => res.status(404).json({ error: "unknown api route" }));
app.use(redirectRouter);

app.use(errorHandler);
export default app;