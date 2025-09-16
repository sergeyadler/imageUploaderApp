import express from "express";
import cors from "cors";
import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();



console.log("IK ENV:", {
    PUBLIC: (process.env.IMAGEKIT_PUBLIC_KEY || '').slice(0, 10),
    PRIVATE: (process.env.IMAGEKIT_PRIVATE_KEY || '').slice(0, 10),
    ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
});
const app = express();

// CORS
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.options("*", cors());

app.use(express.json());

// Init ImageKit
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Auth route
app.get("/auth", (req, res) => {
    try {
        const auth = imagekit.getAuthenticationParameters();
        res.json(auth);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete route
app.delete("/api/delete/:fileId", async (req, res) => {
    try {
        const { fileId } = req.params;
        const resp = await imagekit.deleteFile(fileId);
        res.json({ success: true, response: resp });
    } catch (e) {
        res.status(e?.statusCode || 500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});