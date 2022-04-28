const express = require('express');
const { uploadFile } = require('../../controllers/file.controller');

const router = express.Router();
const multer = require('multer');
const path = require('path');

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'public', 'files'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname.split('.')[0] + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: multerStorage });

router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;
