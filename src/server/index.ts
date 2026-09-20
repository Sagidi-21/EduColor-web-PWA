import express from "express";
import cors from "cors";
import { config } from "dotenv";
import mascotRoutes from "./routes/mascot.routes.ts";
import { errorHandler } from "./middleware/error.middleware.ts";

config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/mascot", mascotRoutes);

app.use(errorHandler);

process.on("unhandledRejection", (reason) => {
  console.error("[mascot-api] Unhandled rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[mascot-api] Uncaught exception:", err);
});

const isMainModule = process.argv[1]?.includes("index.ts") ?? false;
if (isMainModule) {
  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[mascot-api] Server running on port ${PORT}`);
  });
  server.on("error", (err) => {
    console.error("[mascot-api] Server error:", err);
  });
}

export default app;
