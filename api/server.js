const express = require("express");
const http = require("http");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const { registerGameHandlers } = require("./socketHandlers/gameHandlers");

const app = express();
app.use(cors());
app.use(express.json());

// � Rota de upload separada
const uploadsRouter = require("./routes/uploads");
app.use("/upload", uploadsRouter);

// 🌐 Servir os arquivos PDF estaticamente
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔌 Configuração do Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});


// 🧠 Registro dos eventos de jogo
io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  registerGameHandlers(io, socket);
});

module.exports = server;
