require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function generateQuestionsWithGemini(n, topic, difficulty, files = []) {
    const prompt = `
        Gere ${n} perguntas de múltipla escolha com base nos arquivos fornecidos e também no tema "${topic}".
        Nível de dificuldade: "${difficulty}".
        Cada pergunta deve conter 4 opções e um campo "correct" que representa o índice (base 0) da resposta correta.
        Responda APENAS com o array JSON, sem texto adicional.

        Formato esperado:
        [
            {
                "question": "Texto da pergunta",
                "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
                "correct": 0
            }
        ]
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Cria o array de partes para enviar à API
    const parts = [{ text: prompt }];

    // Lê e adiciona cada arquivo da pasta /uploads como inline_data
    for (const file of files) {
        // Suporta tanto string quanto objeto { name, url }
        let filename = file;
        if (typeof file === 'object') {
            if (file.url) {
                // Extrai o nome real salvo (após /uploads/)
                filename = file.url.split('/').pop();
            } else if (file.name) {
                filename = file.name;
            }
        }
        const filePath = path.join(__dirname, '../uploads', filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`Arquivo não encontrado: ${filename}`);
            continue;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileBase64 = fileBuffer.toString('base64');
        const mimeType = getMimeType(filename);

        parts.push({
            inline_data: {
                mime_type: mimeType,
                data: fileBase64
            }
        });
    }

    const requestBody = {
        contents: [{ parts }],
        generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        question: { type: "STRING" },
                        options: { type: "ARRAY", items: { type: "STRING" } },
                        correct: { type: "INTEGER" }
                    },
                    required: ["question", "options", "correct"]
                }
            }
        }
    };

    try {
        const response = await axios.post(apiUrl, requestBody, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const text = response.data.candidates[0].content.parts[0].text;
            return typeof text === 'string' ? JSON.parse(text) : text;
        }

        console.error('Resposta inesperada da API:', response.data);
        return [];
    } catch (error) {
        console.error('Erro ao gerar perguntas com a Gemini API:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        return [];
    }
}

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.txt': return 'text/plain';
        case '.pdf': return 'application/pdf';
        case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case '.md': return 'text/markdown';
        case '.csv': return 'text/csv';
        default: return 'application/octet-stream';
    }
}

module.exports = generateQuestionsWithGemini;

