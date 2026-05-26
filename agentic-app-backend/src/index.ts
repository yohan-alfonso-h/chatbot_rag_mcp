import express from 'express';
import cors from 'cors';
import chatRouter from './routers/chatRouters.js';

const app  = express();

//sample route  
app.get('/', (req, res) => {
    res.send('Hello, Agentic App Backend!');
});

// middleware
app.use(cors());
app.use(express.json());

app.use('/api', chatRouter);


// start the server
const PORT: number  = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});