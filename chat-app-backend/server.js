import express, { Router } from 'express';
import cors from 'cors';
import chatRouter from './src/chatRouter.js';


// Validate required environment variables
const requiredEnvVars = ['GEMINI_APP_KEY', 'GEMINI_MODEL_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('✗ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nℹ Create a .env file in chat-app-backend/ with these variables:');
  console.error('  GEMINI_APP_KEY=your_api_key_here');
  console.error('  GEMINI_MODEL_NAME=gemini-2.5-flash');
  process.exit(1);
}

//create an instance of express
const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? 'localhost';


// enable CORS for all routes
app.use(cors());

//midleware to parse JSON bodies
app.use(express.json());

//define a route
app.get('/', (req, res) => {
  res.json({
    message: `Chat app backend is running on port ${PORT}`,
    endpoints: ['/api/message', '/api/chat'],
  });
});

app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.use('/api',chatRouter);

const server = app.listen(PORT, HOST, () => {
  console.log(`✓ Server is running on http://${HOST}:${PORT}`);
  console.log(`✓ API endpoints available at http://${HOST}:${PORT}/api`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`✗ Error: Port ${PORT} is already in use. Try a different port or kill the process using that port.`);
    process.exit(1);
  }
  console.error('✗ Server error:', err.message);
  process.exit(1);
});

export default app;
// export default app; --- IGNORE ---

// prepare proper curl command for testing the chat endpoint
// curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message": "Hello, how are you?"}'    
