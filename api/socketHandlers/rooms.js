// rooms.js - gerenciamento das salas do socket

const rooms = {};

function getRoom(roomCode) {
  return rooms[roomCode];
}

function createRoom(roomCode, roomData) {
  rooms[roomCode] = roomData;
}

function deleteRoom(roomCode) {
  delete rooms[roomCode];
}

function getAllRooms() {
  return rooms;
}

module.exports = {
  getRoom,
  createRoom,
  deleteRoom,
  getAllRooms,
  rooms, // exporta referência direta se necessário
};
