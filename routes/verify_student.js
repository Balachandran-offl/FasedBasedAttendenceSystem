const { getBucket } = require("../models/gridfs");
const mongoose = require("mongoose");
const express = require('express');
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const router = express.Router();
router.get('/student-status', async (req, res) => {
    try {
        const bucket = getBucket();
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const email = decoded.email;

        // Look for the file in GridFS metadata
        const file = await bucket.find({ "metadata.email": email}).next();

        if (file) {
            res.json({
                exists: true,
                verified: file.metadata.verified // This is the true/false flag
            });
        } else {
            res.json({
                exists: false,
                verified: false
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
router.get('/approved-stats', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        // Count documents in the .files collection of your bucket
        const count = await db.collection("studentImages.files").countDocuments({ 
            "metadata.verified": true 
        });
        
        res.json({ count });
    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: "Error fetching stats" });
    }
});
// 1. GET: Fetch pending images and extract Roll Number from Email
router.get('/pending-verification', async (req, res) => {
    try {
        const bucket = getBucket();
        // Matching your metadata field "verified"
        const files = await bucket.find({ "metadata.verified": false }).toArray();

        if (!files || files.length == 0) {
            return res.status(200).json([]);
        }

        const studentData = await Promise.all(files.map(async (file) => {
            return new Promise((resolve) => {
                const chunks = [];
                const downloadStream = bucket.openDownloadStream(file._id); // Fixed typo: downloadStream

                downloadStream.on('data', (chunk) => chunks.push(chunk));
                downloadStream.on('end', () => {
                    const buffer = Buffer.concat(chunks);

                    // --- LOGIC: Extract Roll Number from Email ---
                    // "23z213@psgtech.ac.in" -> ["23z213", "psgtech.ac.in"] -> "23z213"
                    const email = file.metadata.email || "";
                    const extractedRollNumber = email.split('@')[0];

                    resolve({
                        rollNumber: extractedRollNumber, // Sending the extracted ID to frontend
                        email: email, 
                        qualityScore: file.metadata.qualityScore ?? file.metadata.qualityscore,
                        image: {
                            data: buffer,
                            contentType: file.contentType || "image/jpeg"
                        }
                    });
                });
                
                downloadStream.on('error', (err) => {
                    console.error("Stream error:", err);
                    resolve(null);
                });
            });
        }));

        // Filter out any null values from stream errors
        res.json(studentData.filter(item => item !== null));
    }
    catch (error) {
        console.error("GridFS Fetch Error:", error);
        res.status(500).json({ message: "GridFS Fetch Error" });
    }
});

// 2. POST: Handle Decision using Email lookup (since rollNumber isn't a direct field)
router.post('/verify-decision', async (req, res) => {
    const { rollNumber, action } = req.body; // Frontend sends extracted rollNumber
    const bucket = getBucket();
    
    try {
        // Since we store email, we look for metadata.email starting with the rollNumber
        // This regex ensures we match "23z213@..." exactly
        const emailPattern = new RegExp(`^${rollNumber}@`, 'i');
        const file = await bucket.find({ "metadata.email": emailPattern }).next();

        if (!file) {
            return res.status(404).json({ success: false, message: "Student record not found" });
        }

        if (action === 'accept') {
            const db = mongoose.connection.db;
            await db.collection("studentImages.files").updateOne(
                { _id: file._id },
                { $set: { "metadata.verified": true } }
            );
            return res.json({ success: true, message: "Approved successfully" });
        }

        if (action === 'reject') {
            await bucket.delete(file._id);
            return res.json({ success: true, message: "Rejected and image deleted" });
        }
    }
    catch (error) {
        console.error("Decision Error:", error);
        res.status(500).json({ success: false, message: "Internal Decision Error" });
    }
});

module.exports = router;
