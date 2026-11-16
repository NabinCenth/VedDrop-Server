import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import "dotenv/config";
import { uploadRouter } from "./routes/upload.route.js";
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5500",
  }),
);
app.use(uploadRouter);
app.get("/", (req: Request, res: Response) => {
  
  res.send("Server is running");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
