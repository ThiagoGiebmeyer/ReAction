// ===============================
// Handlers de eventos do Socket.IO para o jogo
// ===============================

// Importa utilitário para gerar perguntas e gerenciar salas
const generateQuestionsWithGemini = require('../utils/generateQuestionsWithGemini');
const roomsUtil = require('./rooms');

// Nomes dos eventos do socket
const EVENT_CREATE_ROOM = 'create_room';
const EVENT_JOIN_ROOM = 'join_room';
const EVENT_QUIT_ROOM = 'quit_room';
const EVENT_GET_PLAYERS = 'get_players';
const EVENT_PLAYER_READY = 'player_ready';
const EVENT_START_GAME = 'start_game';
const EVENT_ANSWER = 'answer';
const EVENT_DISCONNECT = 'disconnect';

// Configurações padrão do jogo
const DEFAULT_TOPIC = 'Assuntos gerais';
const DEFAULT_DIFFICULTY = 'Fácil';
const MAX_PLAYERS_PER_ROOM = 5;


// Função principal para registrar todos os handlers de eventos do socket
function registerGameHandlers(io, socket) {
    // Gera um código aleatório para a sala
    const generateRoomCode = () => {
        return Math.random().toString(36).substring(2, 7).toUpperCase();
    }

    // Busca uma sala pelo código
    const getRoom = (roomCode) => {
        const room = roomsUtil.getRoom(roomCode);
        if (!room) {
            console.warn(`[WARN] Tentativa de acesso à sala inexistente: ${roomCode} pelo socket ${socket.id}`);
        }
        return room;
    };

    // Calcula o ranking final dos jogadores da sala
    const getFinalScores = (room) => {
        const finalScoresData = room.players.map(player => {
            return {
                playerId: player.id,
                username: player.username,
                score: player.score || 0,
            };
        });
        return finalScoresData.sort((a, b) => b.score - a.score);
    };

    // Verifica se todos os jogadores (exceto o host) estão prontos
    const getAllReadyPlayers = (room) => {
        const hostId = room.hostId;
        const otherPlayers = (room.players ?? []).filter(
            (p) => p.id !== hostId
        );
        return otherPlayers.length > 0 && otherPlayers.every((p) => p.isReady);
    };

    // Handler para criar uma nova sala
    socket.on(EVENT_CREATE_ROOM, async ({
        maxQuestions,
        topic = DEFAULT_TOPIC,
        difficulty = DEFAULT_DIFFICULTY,
        files = [],
    }, callback) => {
        try {
            console.debug('[DEBUG] Evento create_room recebido:', { maxQuestions, topic, difficulty, files });
            if (files.length > 3) {
                console.warn('[WARN] Mais de 3 arquivos enviados:', files.length);
                return callback({
                    success: false,
                    message: 'Você pode enviar no máximo 3 arquivos PDF.'
                });
            }

            // Validação dos arquivos enviados
            const invalidFiles = files.filter(file =>
                !file.name?.toLowerCase().endsWith('.pdf') ||
                !file.url ||
                (!file.url.startsWith('http') && !file.url.startsWith('/uploads/'))
            );
            if (invalidFiles.length > 0) {
                console.warn('[WARN] Arquivos inválidos detectados:', invalidFiles);
                return callback({
                    success: false,
                    message: 'Arquivos inválidos. Certifique-se de que são PDFs válidos enviados via upload.'
                });
            }

            // Gera perguntas com base nos PDFs
            const roomCode = generateRoomCode();
            const questions = await generateQuestionsWithGemini(maxQuestions, topic, difficulty, files);
            if (!questions || questions.length === 0) {
                console.warn('[WARN] Nenhuma pergunta gerada para a sala', roomCode);
                return callback({
                    success: false,
                    message: 'Não foi possível gerar perguntas para o jogo.'
                });
            }

            // Criação da sala no utilitário
            roomsUtil.createRoom(roomCode, {
                players: [],
                questions,
                currentQuestionIndex: 0,
                hostId: socket.id,
                gameStarted: false,
                scores: {},
                answerHistory: [],
                settings: {
                    maxQuestionsRequested: maxQuestions,
                    actualQuestions: questions.length,
                    topic,
                    difficulty,
                },
                files: files.map(f => ({
                    name: f.name,
                    url: f.url.startsWith('http')
                        ? f.url
                        : `${process.env.SERVER_URL || 'http://localhost:3000'}${f.url}`,
                })),
                createdAt: new Date().toISOString(),
            });

            console.log(`[INFO] Sala ${roomCode} criada com ${files.length} PDF(s).`);
            callback({ success: true, roomCode });

        } catch (error) {
            console.error('[ERROR] Erro ao criar sala:', error);
            callback({
                success: false,
                message: 'Erro interno ao criar a sala.'
            });
        }
    });

    socket.on(EVENT_JOIN_ROOM, ({ roomCode, username }, callback) => {
        const room = getRoom(roomCode);

        if (!room) {
            return callback({ success: false, message: 'Sala inválida.' });
        }

        if (room.players.find(player => player.id === socket.id)) {
            return callback({ success: true });
        }

        if (room.players.length < MAX_PLAYERS_PER_ROOM) {
            const newPlayer = {
                id: socket.id,
                username: username || `Jogador-${socket.id.substring(0, 4)}`,
                isReady: false,
                score: 0
            };

            room.players.push(newPlayer);
            socket.join(roomCode);
            socket.data = { ...socket.data, username: newPlayer.username, roomCode };

            callback({ success: true });

            const allReady = getAllReadyPlayers(room)

            io.to(roomCode).emit('player_joined', {
                players: room.players,
                allReady
            });
        } else {
            callback({ success: false, message: 'Sala cheia.' });
        }
    });

    socket.on(EVENT_QUIT_ROOM, ({ roomCode }, callback) => {
        const room = getRoom(roomCode);

        if (!room) {
            return callback({ success: false, message: 'Sala inválida.' });
        }

        const playerIndex = room.players.findIndex((p) => p.id === socket.id);

        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            socket.leave(roomCode);
            delete socket.data.roomCode;

            callback({ success: true });
            const allReady = getAllReadyPlayers(room)

            io.to(roomCode).emit('player_left', {
                playerId: socket.id,
                players: room.players,
                allReady
            });

            if (socket.id === room.hostId && room.players.length > 0) {
                room.hostId = room.players[0].id;
                io.to(roomCode).emit('host_changed', { newHostId: room.hostId, players: room.players });
            } else if (room.players.length === 0) {
                console.log(`Sala ${roomCode} está vazia, removendo...`);
                roomsUtil.deleteRoom(roomCode);
            }

        } else {
            callback({ success: true, message: "Usuário não encontrado." });
        }
    });

    socket.on(EVENT_GET_PLAYERS, ({ roomCode }, callback) => {
        const room = getRoom(roomCode);

        if (!room) {
            return callback({ success: false, message: 'Sala inválida.' });
        }
        callback({ success: true, players: room.players });
    });

    socket.on(EVENT_PLAYER_READY, ({ roomCode, isReady }) => {
        const room = getRoom(roomCode);
        if (!room) return;

        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
            player.isReady = isReady;
        }

        const allReady = getAllReadyPlayers(room)

        io.to(roomCode).emit('player_ready_updated', {
            playerId: socket.id,
            isReady: isReady,
            players: room.players,
            allReady
        });
    });

    socket.on(EVENT_START_GAME, ({ roomCode }, callback) => {
        const room = getRoom(roomCode);
        if (!room) {
            return callback({ success: false, message: 'Sala não encontrada.' });
        }

        if (socket.id !== room.hostId) {
            return callback({ success: false, message: 'Apenas o host da sala pode iniciar o jogo.' });
        }

        if (room.players.length < 1) {
            return callback({
                success: false,
                message: `São necessários pelo menos 1 jogador (ou 2, ajuste conforme a regra).`
            });
        }

        if (room.gameStarted) {
            return callback({ success: false, message: 'O jogo já foi iniciado.' });
        }

        room.gameStarted = true;
        room.currentQuestionIndex = 0;
        room.scores = {};
        room.players.forEach(p => p.score = 0);
        room.answerHistory = [];

        if (room.questions && room.questions.length > 0) {
            let cutdown = 3;
            let intervalRef = null;

            intervalRef = setInterval(() => {
                io.to(roomCode).emit('starting_game', { cutdown, start: cutdown === 0 });
                cutdown--;

                if (cutdown < 0) {
                    clearInterval(intervalRef);
                    const question = room.questions[room.currentQuestionIndex];

                    io.to(roomCode).emit('new_question', {
                        question: {
                            question: question.question,
                            options: question.options,
                            index: room.currentQuestionIndex + 1,
                            total: room.questions.length
                        }
                    });
                }
            }, 1000);
            callback({ success: true });
        } else {
            room.gameStarted = false;
            return callback({
                success: false,
                message: "Nenhuma pergunta disponível para iniciar."
            });
        }
    });

    socket.on(EVENT_ANSWER, ({ roomCode, answer }, callback) => {
        const room = getRoom(roomCode);
        if (!room) {
            return callback({ success: false, message: 'Sala não encontrada.' });
        }
        if (!room.gameStarted) {
            return callback({ success: false, message: 'O jogo ainda não começou.' });
        }
        if (room.currentQuestionIndex >= room.questions.length) {
            return callback({ success: false, message: 'O jogo já terminou ou não há mais perguntas.' });
        }

        const currentQuestion = room.questions[room.currentQuestionIndex];
        const currentOptions = room.questions[room.currentQuestionIndex].options;
        const player = room.players.find((p) => p.id === socket.id);

        if (!player) {
            return callback({ success: false, message: 'Jogador não encontrado na sala.' });
        }

        const isCorrect = answer === currentQuestion.correct;

        if (isCorrect) {
            player.score = (player.score || 0) + 1;
            room.scores[player.id] = player.score;
        }

        room.answerHistory.push({
            questionIndex: room.currentQuestionIndex,
            questionText: currentQuestion.question,
            playerId: player.id,
            username: player.username,
            userAnswer: answer,
            answerText: currentOptions[answer],
            correctAnswer: currentQuestion.correct,
            isCorrect: isCorrect
        });

        io.to(roomCode).emit('player_answered', {
            playerId: player.id,
            username: player.username,
            isCorrect: isCorrect,
        });

        room.currentQuestionIndex++;

        if (room.currentQuestionIndex < room.questions.length) {
            const nextQuestion = room.questions[room.currentQuestionIndex];
            io.to(roomCode).emit('new_question', {
                question: {
                    question: nextQuestion.question,
                    options: nextQuestion.options,
                    index: room.currentQuestionIndex + 1,
                    total: room.questions.length
                },
                scores: getFinalScores(room)
            });
        } else {
            const finalScores = getFinalScores(room);
            io.to(roomCode).emit('game_over', {
                message: 'Fim do jogo!',
                scores: finalScores,
                answerHistory: room.answerHistory
            });
        }
        callback({ success: true, correct: isCorrect, currentScore: player.score });
    });

    socket.on(EVENT_DISCONNECT, () => {
        console.log(`Socket ${socket.id} desconectado.`);
        const roomCode = socket.data?.roomCode;
        if (roomCode && roomsUtil.getRoom(roomCode)) {
            const room = roomsUtil.getRoom(roomCode);
            const playerIndex = room.players.findIndex(p => p.id === socket.id);

            if (playerIndex !== -1) {
                const disconnectedPlayer = room.players.splice(playerIndex, 1)[0];
                console.log(`Jogador ${disconnectedPlayer.username} removido da sala ${roomCode} devido à desconexão.`);

                io.to(roomCode).emit('player_left', {
                    playerId: socket.id,
                    username: disconnectedPlayer.username,
                    players: room.players
                });

                if (socket.id === room.hostId && room.players.length > 0) {
                    room.hostId = room.players[0].id;
                    io.to(roomCode).emit('host_changed', { newHostId: room.hostId, players: room.players });
                    console.log(`Novo host da sala ${roomCode} é ${room.players[0].username}`);
                }

                if (room.players.length === 0) {
                    console.log(`Sala ${roomCode} está vazia após desconexão, removendo...`);
                    roomsUtil.deleteRoom(roomCode);
                }
            }
        }
    });
}

module.exports = {
    registerGameHandlers,
};