const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { registerGameHandlers } = require('./socketHandlers/gameHandlers');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

const rooms = {};

io.on('connection', (socket) => {
    registerGameHandlers(io, socket, rooms);
});

module.exports = server;
