import { Router } from "express";
import { refreshToken, registerUser } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register",  registerUser);

authRouter.get("/refresh-token", refreshToken);