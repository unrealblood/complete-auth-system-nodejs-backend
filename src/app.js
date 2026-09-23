import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";

export const app = express();

//middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

//routes
app.use("/api/auth", authRouter);