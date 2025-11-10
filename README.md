# AI Literacy Diagnoser v1.5 (Demo Version)
A 3-5 minute lightweight, game-style self-assessment tool designed for AI beginners.

## Tech Stack

**Frontend**
- React + TypeScript + TailwindCSS + Vite

**Backend**
- Node.js + Express + TypeScript

**Drag-and-Drop Interaction**
- react-dnd

## 🚀 One-Click Start

### For Windows Users
Double-click to run
`start.bat`
file, or execute in the command line:


```bash
start.bat
```

### For Mac/Linux Users

```bash
chmod +x start.sh
./start.sh
```

### Alternatively, use npm commands

```bash
# The first run requires installing dependencies
npm run install:all

# Then start directly
npm start
# Or
npm run dev
```

## 📋 Configuration Instructions

### Gemini API Configuration
The API Key is configured in
`server/src/config/api.ts`.
To modify it:

**Method 1: Directly modify the code**
Edit
`server/src/config/api.ts`
and change the
`apiKey`
field.

**Method 2: Use environment variables (Recommended)**
Create a file
`server/.env`:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
PORT=3000
SESSION_SECRET=your_session_secret_here
CORS_ORIGIN=http://localhost:5173
```


## 🌐 Accessing the App
After a successful start, open your browser and visit:

**Frontend App**: http://localhost:5173

**Backend API**: http://localhost:3000

**Health Check**: http://localhost:3000/health

## ⚠️ Common Issues

### Frontend dependency installation failed (patch-package error)
If you encounter
`patch-package`
related errors:

**Solution**: Double-click to run
`修复并启动.bat`
This script uses
`--ignore-scripts`
to skip problematic postinstall scripts.

### Connection refused (ERR_CONNECTION_REFUSED)
If you see a "connection refused" error, it means the server is not running:
1. **First run**: Double-click `start.bat` (will automatically install dependencies and start the service)
2. **Repair and start**: Double-click `修复并启动.bat` (repairs issues and starts the service)
3. **Subsequent runs**: Double-click `启动服务.bat` (directly starts the service)
For detailed troubleshooting, see: `TROUBLESHOOTING.md`

## Project Structure

```
├── client/          # Frontend React app
├── server/          # Backend Express service
└── README.md
```


## API Interface Description
The backend provides a standardized LLM calling interface. You only need to implement the `callGeminiAPI` method in `server/src/services/llmService.ts`.


