const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📂 Pasta para armazenar PDFs
const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// ⚙️ Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({
  storage,
  limits: { files: 3 }, // máximo 3 arquivos
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Apenas arquivos PDF são permitidos."));
  },
});

const router = express.Router();

// 📤 Endpoint de upload (POST /upload)
router.post("/", upload.array("files", 3), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum arquivo enviado.",
      });
    }

    // Mapeia os arquivos enviados e cria URLs acessíveis
    const files = req.files.map((file) => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
    }));

    res.json({ success: true, files });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao fazer upload dos arquivos.",
    });
  }
});

module.exports = router;

// 🗑️ Endpoint para deletar todos os arquivos da pasta de uploads (DELETE /upload/all)
router.delete("/all", (req, res) => {
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) {
      console.error("Erro ao ler a pasta de uploads:", err);
      return res.status(500).json({
        success: false,
        message: "Erro ao acessar a pasta de uploads.",
      });
    }
    let erroAoDeletar = false;
    files.forEach((file) => {
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, file));
      } catch (e) {
        erroAoDeletar = true;
        console.error(`Erro ao deletar o arquivo ${file}:`, e);
      }
    });
    if (erroAoDeletar) {
      return res.status(500).json({
        success: false,
        message: "Um ou mais arquivos não puderam ser deletados.",
      });
    }
    res.json({ success: true, message: "Todos os arquivos foram deletados." });
  });
});
