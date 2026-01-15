/**
 * =====================================================
 * SABERBOT API SERVER - Backend Proxy per Gemini
 * =====================================================
 * Questo server Express funge da proxy tra il frontend
 * e l'API Gemini, nascondendo la chiave API al client.
 * 
 * Architettura:
 *   Client (browser)
 *       ↓
 *   [POST /api/chat con messaggio]
 *       ↓
 *   Backend Express (questo server)
 *       ↓
 *   [Aggiunge API key da .env]
 *   [Chiama Gemini API]
 *       ↓
 *   Ritorna solo la risposta al client
 * =====================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// --- CONFIGURAZIONE ---
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // In produzione, specifica i domini consentiti
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// --- VALIDAZIONE CHIAVE API ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'inserisci_qui_la_tua_api_key') {
    console.error('❌ ERRORE: Chiave API Gemini non configurata!');
    console.error('→ Copia .env.example in .env e inserisci la tua API key');
    console.error('→ Ottieni una chiave gratis da: https://aistudio.google.com/app/apikey');
    process.exit(1);
}

// Inizializza Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// --- CARICAMENTO KNOWLEDGE BASE ---
let KNOWLEDGE_BASE = '';

function loadKnowledgeBase() {
    // Cerca il file nella cartella padre (principale del sito)
    const kbPath = path.join(__dirname, '..', 'saber_knowledge_base.txt');

    try {
        if (fs.existsSync(kbPath)) {
            KNOWLEDGE_BASE = fs.readFileSync(kbPath, 'utf-8');
            console.log(`✅ Knowledge Base caricata (${KNOWLEDGE_BASE.length.toLocaleString()} caratteri)`);
        } else {
            console.warn('⚠️  ATTENZIONE: File knowledge base non trovato!');
            console.warn(`   Percorso cercato: ${kbPath}`);
        }
    } catch (error) {
        console.error('❌ Errore caricamento Knowledge Base:', error.message);
    }
}

// --- FUNZIONE CHAT ---
async function getChatResponse(userMessage) {
    // Costruzione del Prompt (Istruzioni per l'IA)
    const prompt = `
        Sei SaberBot, l'assistente tecnico di Saber Color S.r.l.
        
        REGOLE FONDAMENTALI:
        1. NON comunicare MAI prezzi, costi o listini. Se l'utente chiede il prezzo, rispondi gentilmente: "Per quotazioni aggiornate e offerte dedicate, ti invitiamo a contattare il nostro ufficio commerciale."
        2. NON presentarti e NON salutare all'inizio di ogni messaggio (es. evita "Ciao, sono SaberBot"). Vai DRITTO alla risposta tecnica.
        3. Saluta e presentati SOLO se l'utente ti dice solo "Ciao" o "Buongiorno" senza fare domande.
        4. Se per una richiesta ci sono più prodotti idonei o diverse soluzioni nel listino, elencale e aggiungi alla fine:
           "Per valutare la soluzione ideale per il tuo caso specifico, ti consiglio di contattare i nostri tecnici compilando il modulo contatti o chiamando lo 0375 782083."
        5. Rispondi SOLO basandoti sui seguenti documenti.

        --- INIZIO CONTESTO TECNICO ---
        ${KNOWLEDGE_BASE}
        --- FINE CONTESTO TECNICO ---

        DOMANDA UTENTE: ${userMessage}
        RISPOSTA TECNICA:
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error('❌ Errore chiamata Gemini:', error.message);
        throw error;
    }
}

// --- ROUTES ---

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'SaberBot API Server',
        version: '1.0.0',
        endpoints: {
            chat: 'POST /api/chat',
            health: 'GET /health'
        }
    });
});

// Health check dettagliato
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        knowledgeBase: {
            loaded: KNOWLEDGE_BASE.length > 0,
            characters: KNOWLEDGE_BASE.length
        },
        gemini: {
            configured: true,
            model: 'gemini-2.0-flash'
        }
    });
});

// Endpoint principale chat (compatibile con il vecchio /chat)
app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({
            error: 'Messaggio vuoto o non valido'
        });
    }

    console.log(`📩 Messaggio ricevuto: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);

    try {
        const botResponse = await getChatResponse(message.trim());
        console.log(`📤 Risposta inviata: ${botResponse.substring(0, 50)}...`);

        res.json({
            response: botResponse
        });
    } catch (error) {
        console.error('💥 Errore elaborazione:', error.message);
        res.status(500).json({
            error: 'Errore interno del server',
            response: 'Mi dispiace, si è verificato un errore tecnico. Riprova tra qualche istante.'
        });
    }
});

// Endpoint API (alias per compatibilità)
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({
            error: 'Messaggio vuoto o non valido'
        });
    }

    try {
        const botResponse = await getChatResponse(message.trim());
        res.json({
            response: botResponse
        });
    } catch (error) {
        console.error('💥 Errore elaborazione:', error.message);
        res.status(500).json({
            error: 'Errore interno del server',
            response: 'Mi dispiace, si è verificato un errore tecnico. Riprova tra qualche istante.'
        });
    }
});

// --- AVVIO SERVER ---
loadKnowledgeBase();

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 SABERBOT API SERVER AVVIATO!');
    console.log('='.repeat(50));
    console.log(`📍 Server in ascolto su: http://localhost:${PORT}`);
    console.log(`🔒 API Key: ****${GEMINI_API_KEY.slice(-4)} (protetta)`);
    console.log(`🤖 Modello: gemini-2.0-flash`);
    console.log('='.repeat(50));
    console.log('\n📡 Endpoints disponibili:');
    console.log(`   POST http://localhost:${PORT}/chat`);
    console.log(`   POST http://localhost:${PORT}/api/chat`);
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log('\n');
});
