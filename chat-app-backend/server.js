import express, { Router } from 'express';
import cors from 'cors';
import chatRouter from './src/chatRouter.js';


//create an instance of express
const app = express();
const PORT = Number(process.env.PORT ?? 3000);


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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


export default app;
// export default app; --- IGNORE ---

// prepare proper curl command for testing the chat endpoint
// curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message": "Hello, how are you?"}'    
