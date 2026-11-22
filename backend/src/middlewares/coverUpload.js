const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function getImageExtension(buffer, mimeType) {
  if (mimeType === "image/png" && buffer.length >= PNG_SIGNATURE.length &&
      buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return ".png";
  }
  if (mimeType === "image/jpeg" && buffer.length >= 3 &&
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg";
  }
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
      const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
      error.message = "Formato inválido. Envie uma imagem PNG ou JPEG.";
      return callback(error);
    }
    callback(null, true);
  },
});

function coverUpload(req, res, next) {
  upload.single("capa")(req, res, (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "A imagem excede o limite de 5 MB." });
      }
      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(415).json({ error: error.message });
      }
      return next(error);
    }

    if (!req.file) return next();

    const extension = getImageExtension(req.file.buffer, req.file.mimetype);
    if (!extension) {
      return res.status(415).json({
        error: "O conteúdo não corresponde a uma imagem PNG ou JPEG válida.",
      });
    }

    const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    const coversPath = path.join(__dirname, "..", "..", "public", "covers");
    fs.mkdir(coversPath, { recursive: true }, (mkdirError) => {
      if (mkdirError) return next(mkdirError);
      fs.writeFile(path.join(coversPath, filename), req.file.buffer, (writeError) => {
        if (writeError) return next(writeError);
        req.file.filename = filename;
        next();
      });
    });
  });
}

module.exports = coverUpload;
module.exports.MAX_FILE_SIZE = MAX_FILE_SIZE;
module.exports.getImageExtension = getImageExtension;
