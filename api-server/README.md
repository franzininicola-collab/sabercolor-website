# 🔒 Guida Setup Backend Proxy - SaberBot

## 📋 Panoramica

Il backend proxy protegge la tua chiave API Gemini nascondendola completamente dal browser.

**Architettura:**
```
Client (browser)
    ↓
[POST /api/chat con messaggio]
    ↓
Backend Express (server privato)
    ↓
[Aggiunge API key da .env]
[Chiama Gemini API]
    ↓
Ritorna solo la risposta al client
```

---

## 🚀 Setup Rapido (Sviluppo Locale)

### 1. Installa Node.js (se non presente)

Scarica e installa da: https://nodejs.org (versione LTS consigliata)

Dopo l'installazione, verifica aprendo un terminale:
```bash
node --version   # Dovrebbe mostrare v18+ o superiore
npm --version    # Dovrebbe mostrare 9+ o superiore
```

### 2. Installa le dipendenze

Apri un terminale nella cartella `api-server` ed esegui:

```bash
cd api-server
npm install
```

### 3. Configura la chiave API

La chiave API è già configurata nel file `.env` (migrata dal vecchio `server.py`).

**⚠️ IMPORTANTE:** Il file `.env` contiene segreti e **non deve mai essere committato** nel repository Git!

### 4. Avvia il server

**Opzione A - Doppio click:**
- Esegui `AVVIA_SERVER.bat`

**Opzione B - Terminale:**
```bash
cd api-server
npm start
```

Vedrai:
```
🚀 SABERBOT API SERVER AVVIATO!
📍 Server in ascolto su: http://localhost:5000
```

### 5. Testa il chatbot

Apri `index.html` nel browser e prova il chatbot!

---

## 📁 Struttura File

```
api-server/
├── .env                 # 🔐 Chiave API (SEGRETO!)
├── .env.example         # Template per nuove installazioni
├── .gitignore           # Esclude .env e node_modules
├── package.json         # Dipendenze npm
├── server.js            # Server Express principale
└── AVVIA_SERVER.bat     # Script avvio rapido
```

---

## 🌐 Deploy su Vercel (Produzione)

### 1. Prepara il progetto Vercel

Crea un file `vercel.json` nella root del progetto:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api-server/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api-server/server.js"
    }
  ]
}
```

### 2. Configura le variabili ambiente su Vercel

1. Vai su https://vercel.com/dashboard
2. Seleziona il tuo progetto
3. Vai in **Settings → Environment Variables**
4. Aggiungi:
   - `GEMINI_API_KEY` = la tua chiave API

### 3. Aggiorna l'URL nel frontend

Modifica `chatbot.js`:

```javascript
// Cambia da:
const CHAT_API_URL = 'http://localhost:5000/chat';

// A:
const CHAT_API_URL = 'https://tuo-progetto.vercel.app/api/chat';
```

### 4. Deploy

```bash
vercel deploy --prod
```

---

## 🔧 Troubleshooting

### ❌ "Node.js non trovato"
- Installa Node.js da https://nodejs.org
- Riavvia il terminale dopo l'installazione

### ❌ "GEMINI_API_KEY non configurata"
- Verifica che esista il file `.env`
- Controlla che contenga `GEMINI_API_KEY=la_tua_chiave`

### ❌ "Knowledge base non trovata"
- Il file `saber_knowledge_base.txt` deve essere nella cartella principale del sito
- Il server lo cerca automaticamente nella cartella padre di `api-server`

### ❌ "CORS error" nel browser
- Verifica che il server sia in esecuzione
- Controlla che l'URL in `chatbot.js` corrisponda all'indirizzo del server

---

## ✅ Vantaggi del Backend Proxy

| Aspetto | Prima (server.py) | Dopo (api-server) |
|---------|-------------------|-------------------|
| Sicurezza API Key | ⚠️ Esposta nel codice | ✅ Nascosta in .env |
| Tecnologia | Python + Flask | Node.js + Express |
| Deploy cloud | Complesso | ✅ Facile su Vercel |
| Manutenzione | Richiede Python | Solo Node.js |

---

## 📞 Supporto

Per problemi tecnici, contatta il supporto IT aziendale.
