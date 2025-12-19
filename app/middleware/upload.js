const util = require("util");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const maxSize = 2 * 1024 * 1024; // 2MB

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../resources/static/assets/uploads/");
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).any(); // Allow any array of files

let uploadFileMiddleware = util.promisify(uploadFile);

module.exports = uploadFileMiddleware;
