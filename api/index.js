// Supondo que './server' exporta uma instância de servidor HTTP ou um app Express
const server = require('./server');

// Define a porta a partir da variável de ambiente PORT ou usa 3001 como padrão
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Ouve em todas as interfaces de rede por padrão
const NODE_ENV = process.env.NODE_ENV || 'development'; // Define o ambiente

// Inicia o servidor
const listener = server.listen(PORT, HOST, () => {
    const address = listener.address(); // Obtém o endereço real em que o servidor está ouvindo
    const actualPort = address.port;
    const actualHost = address.address === '0.0.0.0' || address.address === '::' ? 'localhost' : address.address;

    console.log(`🚀 Servidor rodando em modo ${NODE_ENV}`);
    console.log(`🎧 Ouvindo em http://${actualHost}:${actualPort}`);
    if (NODE_ENV === 'development') {
        console.log(`🔗 Acesso local: http://localhost:${actualPort}`);
    }
});

// Tratamento de erros comuns do servidor
listener.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Porta ${PORT}`;

    // Mensagens de erro específicas
    switch (error.code) {
        case 'EACCES':
            console.error(`🔴 ${bind} requer privilégios elevados (root/administrador).`);
            process.exit(1); // Termina o processo com falha
            break;
        case 'EADDRINUSE':
            console.error(`🔴 ${bind} já está em uso por outro processo.`);
            process.exit(1); // Termina o processo com falha
            break;
        default:
            console.error('❌ Erro desconhecido ao iniciar o servidor:', error);
            throw error; // Re-lança o erro se não for um dos erros comuns de 'listen'
    }
});
