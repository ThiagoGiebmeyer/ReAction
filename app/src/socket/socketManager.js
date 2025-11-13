import { io } from 'socket.io-client';

class SocketManager {
    constructor() {
        this.socket = null;
    }

    connect(serverUrl = process.env.EXPO_PUBLIC_SERVER_URL) {
        if (!this.socket) {
            this.socket = io(serverUrl, {
                autoConnect: false,
            });
        }

        if (!this.socket.connected) {
            this.socket.connect();
        }

        this.socket.on('connect', () => {
            console.log('🔌 Conectado ao WebSocket com ID:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Desconectado do WebSocket');
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data, callback) {
        if (this.socket) {
            this.socket.emit(event, data, callback);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    getSocket() {
        return this.socket;
    }
}

const socketManager = new SocketManager();
export default socketManager;
