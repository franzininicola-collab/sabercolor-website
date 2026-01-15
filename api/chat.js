const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

let KNOWLEDGE_BASE = '';

function loadKnowledgeBase() {
    const possiblePaths = [
        path.join(process.cwd(), 'saber_knowledge_base.txt'),
        path.join(__dirname, '..', 'saber_knowledge_base.txt')
    ];
    
    for (const kbPath of possiblePaths) {
        try {
            if (fs.existsSync(kbPath)) {
                KNOWLEDGE_BASE = fs.readFileSync(kbPath, 'utf-8');
                return;
            }
        } catch (e) { continue; }
    }
}

loadKnowledgeBase();

async function getChatResponse(userMessage, apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Sei SaberBot, l'assistente tecnico di Saber Color S.r.l.
        
REGOLE FONDAMENTALI:
1. NON comunicare MAI prezzi, costi o listini. Se l'utente chiede il prezzo, rispondi: "Per quotazioni aggiornate e offerte dedicate, ti invitiamo a contattare il nostro ufficio commerciale."
2. NON presentarti e NON salutare all'inizio di ogni messaggio. Vai DRITTO alla risposta tecnica.
3. Saluta e presentati SOLO se l'utente ti dice solo "Ciao" o "Buongiorno" senza fare domande.
4. Se ci sono più prodotti idonei, elencali e aggiungi: "Per valutare la soluzione ideale, ti consiglio di contattare i nostri tecnici compilando il modulo contatti o chiamando lo 0375 782083."
5. Rispondi SOLO basandoti sui seguenti documenti.

--- CONTESTO TECNICO ---
${KNOWLEDGE_BASE}
--- FINE CONTESTO ---

DOMANDA UTENTE: ${userMessage}
RISPOSTA TECNICA:`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito. Usa POST.' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API Key non configurata', response: 'Servizio non configurato.' });

    const { message } = req.body || {};
    if (!message || message.trim() === '') return res.status(400).json({ error: 'Messaggio vuoto' });

    try {
        const botResponse = await getChatResponse(message.trim(), apiKey);
        return res.status(200).json({ response: botResponse });
    } catch (error) {
        console.error('Errore:', error.message);
        return res.status(500).json({ response: 'Si è verificato un errore tecnico. Riprova.' });
    }
};
