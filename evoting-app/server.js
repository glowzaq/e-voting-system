import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/User.js";
import Vote from "./models/Vote.js";

dotenv.config();

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    console.warn("WARNING: ADMIN_USERNAME, ADMIN_PASSWORD, or ADMIN_SECRET is missing from .env.");
}

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── STATIC PAGES ──
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/results", (req, res) => res.sendFile(path.join(__dirname, "public", "results.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.get("/admin/login", (req, res) => res.sendFile(path.join(__dirname, "public", "admin-login.html")));

// ── ELECTION STATE (in-memory) ──
let electionOpen = true;

// ── ADMIN MIDDLEWARE ──
function requireAdmin(req, res, next) {
    const token = req.headers["x-admin-token"];
    if (token !== process.env.ADMIN_SECRET) return res.status(401).json({ error: "Unauthorized" });
    next();
}

// ── HELPERS ──
function generateVoterId() {
    return "VOT-" + Math.floor(100000 + Math.random() * 900000);
}

// ── DATABASE CONNECTION & START ──
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(process.env.PORT || 3000, () => console.log("Server running"));
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

// ── REGISTER ──
app.post("/register", async (req, res) => {
    try {
        const { firstName, lastName, email, nationalId, password } = req.body;

        if (!/^[0-9]{10}$/.test(String(nationalId || ""))) {
            return res.status(400).json({ error: "National ID must be exactly 10 digits" });
        }

        if (await User.findOne({ email })) return res.status(400).json({ error: "This email is already registered" });
        if (await User.findOne({ nationalId })) return res.status(400).json({ error: "This National ID has already been used to register" });

        const hashedPassword = await bcrypt.hash(password, 10);

        let voterId;
        do {
            voterId = generateVoterId();
        } while (await User.findOne({ voterId }));

        const user = new User({ firstName, lastName, email, nationalId, password: hashedPassword, voterId });
        await user.save();

        res.status(201).json({ message: "User registered successfully", voterId });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        if (err.code === 11000) {
            const fld = Object.keys(err.keyValue || {})[0];
            if (fld === "email") return res.status(400).json({ error: "An account with this email already exists" });
            if (fld === "nationalId") return res.status(400).json({ error: "This National ID has already been registered" });
            if (fld === "voterId") return res.status(400).json({ error: "Duplicate voter ID detected. Please try again" });
            return res.status(400).json({ error: "Duplicate registration detected" });
        }
        res.status(500).json({ error: "Registration failed. Please try again." });
    }
});

// ── LOGIN ──
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.json({
        message: "Login successful",
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            nationalId: user.nationalId,
            voterId: user.voterId,
            role: user.role,
            hasVoted: user.hasVoted,
        },
    });
});

// ── FORGOT PASSWORD ──
app.post("/forgot-password", async (req, res) => {
    try {
        const { email, nationalId, password } = req.body;

        if (!email || !nationalId || !password) {
            return res.status(400).json({ error: "Email, National ID, and new password are required." });
        }

        if (!/^[0-9]{10}$/.test(String(nationalId))) {
            return res.status(400).json({ error: "National ID must be exactly 10 digits." });
        }

        const user = await User.findOne({ email, nationalId });
        if (!user) {
            return res.status(404).json({ error: "No account found matching that email and national ID." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (err) {
        console.error("FORGOT PASSWORD ERROR:", err);
        res.status(500).json({ error: "Unable to reset password. Please try again." });
    }
});

// ── VOTE ──
app.post("/vote", async (req, res) => {
    try {
        if (!electionOpen) return res.status(403).json({ error: "The election is currently closed. Voting is not allowed." });
        const { voterId, candidate } = req.body;
        const user = await User.findOne({ voterId });
        if (!user) return res.status(404).json({ error: "Invalid Voter ID" });
        if (user.hasVoted) return res.status(400).json({ error: "You have already voted" });
        await Vote.create({ voterId, candidate });
        user.hasVoted = true;
        await user.save();
        res.json({ message: "Vote successfully recorded" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ── HAS VOTED ──
app.get("/has-voted/:voterId", async (req, res) => {
    try {
        const user = await User.findOne({ voterId: req.params.voterId });
        if (!user) return res.status(404).json({ error: "Voter not found" });
        res.json({ hasVoted: user.hasVoted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUBLIC RESULTS ──
app.get("/api/results", async (req, res) => {
    const iniVotes = await Vote.countDocuments({ candidate: "Ini" });
    const tinubuVotes = await Vote.countDocuments({ candidate: "Tinubu" });
    const registeredVoters = await User.countDocuments();
    const totalVotes = iniVotes + tinubuVotes;
    res.json({ Ini: iniVotes, Tinubu: tinubuVotes, registeredVoters, totalVotes, turnout: registeredVoters > 0 ? Math.round((totalVotes / registeredVoters) * 100) : 0, electionOpen });
});

// keep old /results behavior for back-compat with dashboard.js
app.get("/results", async (req, res) => {
    if (req.accepts("html") && !req.headers["x-requested-with"]) return res.sendFile(path.join(__dirname, "public", "results.html"));
    const iniVotes = await Vote.countDocuments({ candidate: "Ini" });
    const tinubuVotes = await Vote.countDocuments({ candidate: "Tinubu" });
    const registeredVoters = await User.countDocuments();
    res.json({ Ini: iniVotes, Tinubu: tinubuVotes, registeredVoters, electionOpen });
});

app.get("/election/status", (req, res) => res.json({ electionOpen }));

// ══════════════════════════════════════
//  ADMIN ROUTES (protected)
// ══════════════════════════════════════

app.post("/admin/login", async (req, res) => {
    const { username, password } = req.body;
    if (!process.env.ADMIN_SECRET) {
        return res.status(500).json({ error: "Admin secret is not configured. Please set ADMIN_SECRET in .env." });
    }
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid admin credentials" });
    }
    res.json({ message: "Admin login successful", token: process.env.ADMIN_SECRET });
});

app.get("/admin/voters", requireAdmin, async (req, res) => {
    try {
        const voters = await User.find({}, { password: 0, __v: 0 }).sort({ createdAt: -1 });
        res.json({ voters });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/admin/stats", requireAdmin, async (req, res) => {
    try {
        const iniVotes = await Vote.countDocuments({ candidate: "Ini" });
        const tinubuVotes = await Vote.countDocuments({ candidate: "Tinubu" });
        const registeredVoters = await User.countDocuments();
        const votedVoters = await User.countDocuments({ hasVoted: true });
        const totalVotes = iniVotes + tinubuVotes;
        res.json({ Ini: iniVotes, Tinubu: tinubuVotes, registeredVoters, votedVoters, notVotedVoters: registeredVoters - votedVoters, totalVotes, turnout: registeredVoters > 0 ? Math.round((totalVotes / registeredVoters) * 100) : 0, electionOpen });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/admin/election/toggle", requireAdmin, (req, res) => {
    electionOpen = !electionOpen;
    res.json({ message: `Election is now ${electionOpen ? "open" : "closed"}`, electionOpen });
});

app.delete("/admin/votes/reset", requireAdmin, async (req, res) => {
    try {
        await Vote.deleteMany({});
        await User.updateMany({}, { hasVoted: false });
        res.json({ message: "All votes have been reset successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/admin/export/csv", requireAdmin, async (req, res) => {
    try {
        const voters = await User.find({}, { password: 0, __v: 0 });
        const headers = ["First Name", "Last Name", "Email", "National ID", "Voter ID", "Has Voted", "Registered At"];
        const rows = voters.map(v => [v.firstName, v.lastName, v.email, v.nationalId, v.voterId, v.hasVoted ? "Yes" : "No", v.createdAt ? new Date(v.createdAt).toISOString() : "N/A"]);
        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=evote-voters.csv");
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/admin/voters/:id", requireAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: "Voter not found" });
        if (user.hasVoted) await Vote.deleteOne({ voterId: user.voterId });
        res.json({ message: "Voter deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
