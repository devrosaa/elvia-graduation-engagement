import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import graduationScheduler from "./services/graduationScheduler";
import conversationRoutes from "./routes/conversation";
import webhookRoutes from "./routes/webhook";
import healthRoutes from "./routes/health";

dotenv.config();

const app = express();
const PORT = process.env["PORT"] || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", conversationRoutes);
app.use("/api", webhookRoutes);
app.use("/api", healthRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env["NODE_ENV"] === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Elvia Graduation Engagement System running on port ${PORT}`);
  console.log(`📅 Graduation scheduler started`);

  // Start the graduation scheduler
  graduationScheduler.start();
});

export default app;
