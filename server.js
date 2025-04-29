// Simple HTTP Server for local development
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Handle favicon.ico
  if (req.url === '/favicon.ico') {
    res.statusCode = 204; // No content
    res.end();
    return;
  }
  
  // Parse URL
  let filePath = req.url;
  
  // Default to index.html
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  // Resolve the file path
  const resolvedPath = path.resolve(process.cwd() + filePath);
  
  // Get file extension
  const ext = path.extname(resolvedPath);
  
  // Set content type based on file extension
  const contentType = MIME_TYPES[ext] || 'text/plain';
  
  // Read file
  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end(`File ${filePath} not found!`);
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Error: ${err.code}`);
      }
      return;
    }
    
    // Success - send the file
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop the server');
}); 