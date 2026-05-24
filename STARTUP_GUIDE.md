# Chatbot RAG MCP - Startup Guide

## Prerequisites
- Node.js 18+ installed
- npm installed  
- Google Gemini API key

## Setup Instructions

### 1. **Configure Backend Environment**
In `chat-app-backend/`, create a `.env` file:
```
GEMINI_APP_KEY=your_gemini_api_key_here
GEMINI_MODEL_NAME=gemini-2.5-flash
PORT=3000
HOST=localhost
```

### 2. **Terminal 1: Start Backend Server**
```bash
cd chat-app-backend
npm install  # if not done yet
npm start
```

✓ You should see:
```
✓ Server is running on http://localhost:3000
✓ API endpoints available at http://localhost:3000/api
```

**Wait for this message before proceeding!**

### 3. **Terminal 2: Start Frontend (Angular App)**
```bash
cd bot-ai
npm install  # if not done yet
npm start
```

✓ The Angular dev server will start at `http://localhost:4200`

### 4. **Access the App**
Open your browser to `http://localhost:4200`

---

## Troubleshooting

### Error: `ECONNREFUSED` or status 500
- ❌ Backend is not running
- ✓ Make sure to run `npm start` in `chat-app-backend` first
- ✓ Verify backend is listening on port 3000

### Error: "Missing required environment variables"
- ❌ `.env` file not created in `chat-app-backend/`
- ✓ Copy `.env.example` to `.env` and fill in GEMINI_API_KEY

### Error: "Port 3000 already in use"
- ❌ Another process is using port 3000
- ✓ Kill the process: `netstat -ano | findstr :3000` (Windows) then kill the PID
- ✓ Or change PORT in `.env` to a different port (e.g., 3001)

### Error: "API key is invalid"
- ❌ GEMINI_APP_KEY is wrong or expired
- ✓ Get a new API key from https://aistudio.google.com/

---

## Development Scripts

**Backend:**
- `npm start` - Production mode
- `npm run dev` - Development with auto-reload (watch mode)

**Frontend:**
- `npm start` - Development server with hot reload
- `npm build` - Production build
- `npm test` - Run tests

---

## Architecture
- **Frontend**: Angular 21 app on port 4200
- **Backend**: Express.js server on port 3000
- **Proxy**: `/api/*` requests routed to http://localhost:3000/api/*
- **AI**: Google Gemini API via @google/genai
- **RAG**: Local FAQ + Knowledge Base with vector embeddings
