const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
console.log("🚀 VedDrop server starting...");

// CORS setup
const corsOptions = {
  origin: ["http://localhost:5173", "https://veddrop.netlify.app"],
  methods: ["GET", "POST", "OPTIONS"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// JSON DB in memory (optional backup to file)
const dbPath = path.join(__dirname, "files.json");
let fileDB = {};
if (fs.existsSync(dbPath)) {
  fileDB = JSON.parse(fs.readFileSync(dbPath));
  console.log(`📦 Loaded files.json with ${Object.keys(fileDB).length} entries`);
} else {
  console.log("📦 files.json not found, starting with empty DB");
}
function saveDB() {
  fs.writeFileSync(dbPath, JSON.stringify(fileDB, null, 2));
}

// Generate 6-digit PIN
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Memory storage for multer
const upload = multer({
  storage: multer.memoryStorage(),

});

// Root route
app.get("/", (req, res) => {
  res.send("Hello from VedDrop Server (Memory Storage!)");
});

// Upload route
app.post("/upload", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("❌ Multer error:", err);
      return res.status(500).json({ error: "File upload failed" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const pin = generatePin();
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    // Store in memory
    fileDB[pin] = {
      originalname: req.file.originalname,
      buffer: req.file.buffer, // file content in memory
      expiry: expiryDate.toISOString(),
      size: req.file.size,
    };

    console.log(`✅ File uploaded: ${req.file.originalname}`);
    console.log(`🔐 PIN: ${pin}`);
    console.log(`⏳ Expires at: ${expiryDate.toISOString()}`);

    saveDB(); // optional backup
    return res.json({ message: "File uploaded successfully", pin });
  });
});

// Download route
app.get("/upload/:pin", (req, res) => {
  const { pin } = req.params;
  const fileEntry = fileDB[pin];

  if (!fileEntry) return res.status(404).json({ error: "PIN not found" });

  const now = new Date();
  if (now > new Date(fileEntry.expiry)) {
    delete fileDB[pin];
    return res.status(410).json({ error: "PIN expired" });
  }

  res.set({
    "Content-Disposition": `attachment; filename="${fileEntry.originalname}"`,
    "Content-Type": "application/octet-stream",
  });

  res.send(fileEntry.buffer);
});

// Expired file cleaner (memory)
setInterval(() => {
  const now = Date.now();
  let changed = false;

  for (const pin in fileDB) {
    if (new Date(fileDB[pin].expiry).getTime() <= now) {
      delete fileDB[pin];
      changed = true;
      console.log(`🗑️ Expired PIN ${pin} removed from memory`);
    }
  }

  if (changed) saveDB();
}, 60 * 1000);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🟢 VedDrop server running on port ${PORT}`);
});
