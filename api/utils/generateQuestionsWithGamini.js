// Importa o módulo dotenv para carregar variáveis de ambiente do arquivo .env
require('dotenv').config();
// Importa o módulo axios para fazer requisições HTTP
const axios = require('axios');

/**
 * Gera perguntas de múltipla escolha usando a API Gemini.
 * @param {number} n - O número de perguntas a serem geradas.
 * @param {string} topic - O tópico das perguntas.
 * @param {string} difficulty - A dificuldade das perguntas (ex: "fácil", "médio", "difícil").
 * @returns {Promise<Array<Object>>} Uma promessa que resolve para um array de objetos de pergunta, ou um array vazio em caso de erro.
 */
async function generateQuestionsWithGemini(n, topic, difficulty) {
    // Constrói o prompt para a API Gemini, solicitando perguntas no formato JSON especificado.
    const prompt = `
        Gere ${n} perguntas de múltipla escolha sobre "${topic}", com dificuldade "${difficulty}".
        Cada pergunta deve conter 4 opções e um campo "correct" que representa o índice (base 0) da resposta correta.
        Responda APENAS com o array JSON, sem nenhum texto adicional antes ou depois.

        Formato esperado:
        [
            {
                "question": "Texto da pergunta",
                "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
                "correct": 0 
            }
        ]
    `;

    // Define a URL da API Gemini, incluindo a chave da API carregada das variáveis de ambiente.
    // Certifique-se de que GEMINI_API_KEY está definida no seu arquivo .env
    const apiKey = 'AIzaSyACuP3qSHhhhJfspyxahFsjPlNh71yCNPM';
    
    if (!apiKey) {
        console.error('Erro: GEMINI_API_KEY não encontrada nas variáveis de ambiente.');
        return [];
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Define o corpo da requisição para a API Gemini.
    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: prompt,
                    },
                ],
                role: 'user', // O papel do remetente do prompt
            },
        ],
        generationConfig: {
            temperature: 0.7, // Controla a aleatoriedade da saída. Valores mais altos = mais criativo.
            // responseMimeType: "text/plain" // Se você quiser a resposta como texto puro e fazer o parse manualmente.
            responseMimeType: "application/json", // Solicita que a API retorne uma string JSON formatada.
            responseSchema: { // Define o esquema esperado para a resposta JSON.
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        question: { type: "STRING" },
                        options: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        correct: { type: "INTEGER" }
                    },
                    required: ["question", "options", "correct"]
                }
            }
        },
    };

    try {
        // Faz a requisição POST para a API Gemini usando axios.
        const response = await axios.post(apiUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json', // Define o tipo de conteúdo da requisição.
            },
        });

        // Extrai o conteúdo da resposta da API.
        // Com responseMimeType: "application/json", a API já deve retornar o JSON diretamente na parte de texto.
        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
            const candidate = response.data.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                // A API, quando responseMimeType é application/json, retorna o JSON como texto na primeira parte.
                // O axios já deve ter parseado se o Content-Type da resposta for application/json.
                // Se parts[0].text for uma string JSON, axios pode ou não parseá-la automaticamente.
                // Se for um objeto, já está parseado. Se for string, precisamos parsear.
                let questionsJson = candidate.content.parts[0].text;
                if (typeof questionsJson === 'string') {
                    try {
                        return JSON.parse(questionsJson);
                    } catch (parseError) {
                        console.error('Erro ao fazer o parse do JSON da API Gemini:', parseError.message);
                        console.error('String JSON recebida:', questionsJson);
                        return [];
                    }
                } else if (typeof questionsJson === 'object') {
                    return questionsJson; // Já é um objeto JSON
                } else {
                    console.error('Formato inesperado da parte de texto da API Gemini:', questionsJson);
                    return [];
                }
            } else {
                console.error('Resposta da API Gemini não contém parts válidas:', candidate.content);
                return [];
            }
        } else {
            console.error('Resposta da API Gemini não contém candidates válidos:', response.data);
            return [];
        }

    } catch (error) {
        // Trata erros que podem ocorrer durante a requisição.
        console.error('Erro ao gerar perguntas com a Gemini API:');
        if (error.response) {
            // O servidor respondeu com um status de erro (4xx ou 5xx)
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2)); // Loga a resposta de erro completa da API
        } else if (error.request) {
            // A requisição foi feita mas não houve resposta
            console.error('Request:', error.request);
        } else {
            // Algo aconteceu ao configurar a requisição que acionou um erro
            console.error('Error Message:', error.message);
        }
        return []; // Retorna um array vazio em caso de erro.
    }
}

// Exemplo de como usar a função (opcional, para teste)
async function testGeneration() {
    console.log("Gerando perguntas...");
    // Certifique-se de ter um arquivo .env com GEMINI_API_KEY="SUA_CHAVE_API_AQUI"
    const questions = await generateQuestionsWithGemini(2, "História do Brasil", "fácil");
    if (questions.length > 0) {
        console.log("Perguntas geradas:");
        console.log(JSON.stringify(questions, null, 2));
    } else {
        console.log("Nenhuma pergunta foi gerada devido a um erro.");
    }
}

// Descomente a linha abaixo para testar a função diretamente ao executar este arquivo.
// testGeneration();

// Exporta a função para que possa ser usada em outros módulos.
module.exports = generateQuestionsWithGemini;
