const express = require('express');
const app = express();
const multer =require('multer');
const cors=require('cors');
const fs = require("fs");
const path = require("path");
console.log("🚀 VedDrop server starting...");
console.log("📁 Base directory:", __dirname);
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📂 uploads folder created");
}
// Allow requests from your frontend
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://veddrop.netlify.app"
  ],
  methods: ["GET", "POST", "OPTIONS"],
};

app.use(cors(corsOptions));



app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// Path to JSON database
const dbPath = path.join(__dirname, "files.json");
app.use('/files', express.static(path.join(__dirname, 'uploads')));
// Load or initialize JSON database
let fileDB = {};

if (fs.existsSync(dbPath)) {
  fileDB = JSON.parse(fs.readFileSync(dbPath));
  console.log(`📦 Loaded files.json with ${Object.keys(fileDB).length} entries`);
} else {
  console.log("📦 files.json not found, starting with empty DB");
}


// Save JSON DB function
function saveDB() {
  fs.writeFileSync(dbPath, JSON.stringify(fileDB, null, 2));
}
//generate 6 digit pin
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

//Get Request 
app.get('/',(req,res)=>{
    res.send("Hello from File Sharing Server");
    console.log("Request received at /");
});
//Get request for file access
app.get('/upload/:pin', (req, res) => {
  const { pin } = req.params;
  const fileEntry = fileDB[pin];

  if (!fileEntry) {
    console.log(`❌ PIN not found: ${pin}`);
    return res.status(404).json({ error: 'PIN not found' });
  }

  const now = new Date();
  const expiryDate = new Date(fileEntry.expiry);

  if (now > expiryDate) {
    console.log(`❌ PIN expired: ${pin}`);
    return res.status(410).json({ error: 'PIN expired' });
  }

  const filePath = path.join(__dirname, "uploads", fileEntry.filename);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found on disk: ${fileEntry.filename}`);
    return res.status(404).json({ error: 'File missing on server' });
  }

  const host = process.env.HOST || `http://localhost:${PORT}`;
  return res.json({
    message: "File is ready",
    filename: fileEntry.filename,
    url: `${host}/files/${fileEntry.filename}`,
    size: fileEntry.size
  });
});

//post request for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // relative folder
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // prepend timestamp
  }
});
const upload = multer({ storage });

app.post("/upload", (req, res) => {
  upload.single("file")(req, res, err => {
    if (err) {
      console.error("❌ Multer error:", err);
      return res.status(500).json({ error: "File upload failed" });
    }

    console.log("📤 Upload request received");

    if (!req.file) {
      console.log("❌ No file received");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const pin = generatePin();
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);

    fileDB[pin] = {
      filename: req.file.filename,
      expiry: expiryDate.toISOString(),
      size: req.file.size
    };

    saveDB();

    console.log(`✅ File uploaded: ${req.file.originalname}`);
    console.log(`🔐 PIN generated: ${pin}`);
    console.log(`⏳ Expires at: ${expiryDate.toISOString()}`);

    return res.json({
      message: "File uploaded successfully",
      pin,
      filename: req.file.filename
    });
  });
});


// Expired file eater
setInterval(() => {
  const now = Date.now();
  let changed = false;

  const TWENTY_DAYS = 20 * 24 * 60 * 60 * 1000;

  for (const pin in fileDB) {
    const expiryTime = new Date(fileDB[pin].expiry).getTime();

    // normal expiry (10 minutes)
    if (expiryTime <= now) {
      const filePath = path.join(__dirname, "uploads", fileDB[pin].filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      delete fileDB[pin];
      changed = true;
      console.log(`Expired PIN ${pin} removed`);
      continue; // move to next pin
    }

    // safety cleanup (20 days)
    if (now - expiryTime > TWENTY_DAYS) {
      delete fileDB[pin];
      changed = true;
    }
  }

  if (changed) saveDB();
}, 60 * 1000);


const PORT = process.env.PORT || 3000; // fallback for local dev
app.listen(PORT, () => {
  console.log(`🟢 VedDrop server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});
