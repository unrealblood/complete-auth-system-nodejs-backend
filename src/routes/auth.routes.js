import { Router } from "express";
import { login, logout, logoutAll, refreshToken, registerUser } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register",  registerUser);

authRouter.post("/login", login);

authRouter.get("/refresh-token", refreshToken);

authRouter.get("/logout", logout);

authRouter.get("/logout-all", logoutAll);