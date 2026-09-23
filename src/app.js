import express from "express";

export const app = express();

//middlewares
app.use(express.json());

//routes