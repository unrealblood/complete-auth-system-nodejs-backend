import { Router } from "express";
import { logout, refreshToken, registerUser } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register",  registerUser);

authRouter.get("/refresh-token", refreshToken);

authRouter.get("/logout", logout);