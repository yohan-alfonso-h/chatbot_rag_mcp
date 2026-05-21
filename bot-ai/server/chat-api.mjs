import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3000);

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

const server = createServer(async (request, response) => {
  if (request.method === 'POST' && request.url === '/api/chat') {
    try {
      const { message } = await readJson(request);

      if (typeof message !== 'string' || !message.trim()) {
        sendJson(response, 400, { error: 'Message is required.' });
        return;
      }

      sendJson(response, 200, {
        reply: `You said: ${message}`,
      });
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body.' });
    }

    return;
  }

  sendJson(response, 404, { error: 'Not found.' });
});

server.listen(port, () => {
  console.log(`Chat API listening on http://localhost:${port}`);
});
