const generateQuestionsWithGamini = require('../utils/generateQuestionsWithGamini');

const DEFAULT_TOPIC = 'Assuntos gerais';
const DEFAULT_DIFFICULTY = 'Fácil';
const MAX_PLAYERS_PER_ROOM = 5;

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function registerGameHandlers(io, socket, rooms) {
    const getRoom = (roomCode) => {
        const room = rooms[roomCode];
        if (!room) {
            console.warn(`Tentativa de acesso à sala inexistente: ${roomCode} pelo socket ${socket.id}`);
        }
        return room;
    };

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

    const getAllReadyPlayers = (room) => {
        const hostId = room.hostId;
        const otherPlayers = (room.players ?? []).filter(
            (p) => p.id !== hostId
        );

        return otherPlayers.length > 0 && otherPlayers.every((p) => p.isReady);
    };

    socket.on('create_room', async ({
        maxQuestions,
        topic = DEFAULT_TOPIC,
        difficulty = DEFAULT_DIFFICULTY,
    }, callback) => {
        try {
            const roomCode = generateRoomCode();
            const questions = await generateQuestionsWithGamini(maxQuestions, topic, difficulty);

            if (!questions || questions.length === 0) {
                return callback({ success: false, message: 'Não foi possível gerar perguntas para o jogo.' });
            }

            rooms[roomCode] = {
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
            };

            callback({ success: true, roomCode });
        } catch (error) {
            console.error(`Erro ao criar sala:`, error);
            callback({ success: false, message: 'Erro interno ao criar a sala.' });
        }
    });

    socket.on('join_room', ({ roomCode, username }, callback) => {
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

    socket.on('quit_room', ({ roomCode }, callback) => {
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
                delete rooms[roomCode];
            }

        } else {
            callback({ success: true, message: "Usuário não encontrado." });
        }
    });


    socket.on('get_players', ({ roomCode }, callback) => {
        const room = getRoom(roomCode);

        if (!room) {
            return callback({ success: false, message: 'Sala inválida.' });
        }
        callback({ success: true, players: room.players });
    });


    socket.on('player_ready', ({ roomCode, isReady }) => {
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


    socket.on('start_game', ({ roomCode }, callback) => {
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

    socket.on('answer', ({ roomCode, answer }, callback) => {
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

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} desconectado.`);
        const roomCode = socket.data?.roomCode;
        if (roomCode && rooms[roomCode]) {
            const room = rooms[roomCode];
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
                    delete rooms[roomCode];
                }
            }
        }
    });
}

module.exports = {
    registerGameHandlers,
    generateRoomCode,
};