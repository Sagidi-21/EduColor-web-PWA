import express from "express";
import cors from "cors";
import { config } from "dotenv";
import mascotRoutes from "./routes/mascot.routes";
import { errorHandler } from "./middleware/error.middleware";

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

const isMainModule = process.argv[1] && process.argv[1].endsWith("index.ts");
if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`[mascot-api] Server running on port ${PORT}`);
  });
}

export default app;
