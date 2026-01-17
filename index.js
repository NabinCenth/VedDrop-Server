const express = require('express');
const app = express();
const multer =require('multer');
const cors=require('cors');
const fs = require("fs");
const path = require("path");

// Path to JSON database
const dbPath = path.join(__dirname, "files.json");

// Load or initialize JSON database
if (fs.existsSync(dbPath)) {
  fileDB = JSON.parse(fs.readFileSync(dbPath));
}

// Save JSON DB function
function saveDB() {
  fs.writeFileSync(dbPath, JSON.stringify(fileDB, null, 2));
}
//generate 6 digit pin
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// Allow requests from your frontend
app.use(cors({
  origin: "http://localhost:5173"
}));
//Get Request 
app.get('/',(req,res)=>{
    res.send("Hello from File Sharing Server");
    console.log("Request received at /");
});
//post request for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // relative folder
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // prepend timestamp
  }
});
const upload =multer({storage})
app.post('/upload',upload.single("file"),(req,res)=>{
     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const pin = generatePin();
  const expiryDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes


  // Add entry to JSON DB
  fileDB[pin] = {
    filename: req.file.filename,   // file name saved with timestamp
    expiry: expiryDate.toISOString()
  };

  // Save JSON
  saveDB();

  console.log("File uploaded:", req.file.filename, "PIN:", pin);
  res.json({ message: "File uploaded successfully", pin, filename: req.file.filename });
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


app.listen(300,()=>{
    console.log("Server is running on port 300");
})