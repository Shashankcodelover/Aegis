const express = require('express');
const proxy = require('express-http-proxy');
const app = express();

app.use('/defender', proxy('localhost:3001')); // Folder 1
app.use('/gateway', proxy('localhost:4000'));  // Folder 2
app.use('/', proxy('localhost:3000'));         // Frontend (Main)

const PORT = process.env.PORT || 8082;

const server = app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set a different PORT env var or kill the process.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
