import { connectAndGetMongoDbClient } from "../db/db.js";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import crypto from "crypto";

export async function registerUser(req, res) {
    const {username, email, password} = req.body;

    const client = await connectAndGetMongoDbClient();
    const db = client.db();
    
    const user = await db.collection("users").findOne({$or: [{username}, {email}]});
    if(user) {
        return res.status(409).json({message: "User already exists."});
    }

    const newUser = {
        username,
        email,
        password
    };

    const insertResult = await db.collection("users").insertOne(newUser);
    newUser._id = insertResult.insertedId.toString();

    const refreshToken = jwt.sign({id: insertResult.insertedId.toString()}, process.env.JWT_SECRET, {expiresIn: "30d"});

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const newSession = {
        userId: ObjectId.createFromHexString(newUser._id),
        refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        createdAt:new Date(),
        updatedAt:new Date(),
        revoked: false
    };

    const sessionInsertResult = await db.collection("sessions").insertOne(newSession);
    newSession._id = sessionInsertResult.insertedId.toString();

    await client.close();

    const accessToken = jwt.sign({
        id: newUser._id,
        sessionId: newSession._id
    }, process.env.JWT_SECRET, {expiresIn: "15m"});

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        expiresIn: 30 * 24 * 60 * 60 * 1000 //30 days
    });

    return res.status(201).json({message: "User registered successfully", user: newUser, accessToken});
}

export async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken) {
        return res.status(401).json({message: "refreshToken not found"});
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        const client = await connectAndGetMongoDbClient();
        const db = client.db();

        const session = await db.collection("sessions").findOne({refreshTokenHash, revoked: false});

        if(!session) {
            return res.status(400).json({message: "invalid refresh token"});
        }

        const accessToken = jwt.sign({id: decoded.id}, process.env.JWT_SECRET, {expiresIn: "15m"});

        const newRefreshToken = jwt.sign({id: decoded.id}, process.env.JWT_SECRET, {expiresIn: "30d"});

        const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

        await db.collection("sessions").findOneAndUpdate({_id: session._id}, {$set: {"refreshTokenHash": newRefreshTokenHash}});

        await client.close();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            expiresIn: 30 * 24 * 60 * 60 * 1000 // 30days
        });

        return res.status(200).json({message: "Access token refreshed successfully", accessToken});
    }
    catch(error) {
        return res.status(401).json({message: error.message });
    }
}

export async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken) {
        return res.status(400).json({message: "refresh token not found"});
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const client = await connectAndGetMongoDbClient();
    const db = client.db();
    
    const session = await db.collection("sessions").findOne({refreshTokenHash, revoked: false});
    
    if(!session) {
        return res.status(400).json({message: "invalid refresh token"});
    }

    await db.collection("sessions").updateOne({_id: session._id}, {$set: {"revoked": true}});

    await client.close();

    res.clearCookie("refreshToken");
    
    return res.status(200).json({message: "logged out successfully"});
}