const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Helper function to send response
const sendResponse = (res, statusCode, message) => {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
  res.end(message);
};

// Serve the HTML file
const serveHtml = (res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendResponse(res, 500, 'Error loading HTML file');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  });
};

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const action = parsedUrl.pathname.split('/')[1];
  const filename = parsedUrl.pathname.split('/')[2];

  if (req.method === 'GET' && req.url === '/') {
    serveHtml(res);
  } else {
    if (!filename) {
      sendResponse(res, 400, 'Filename is required');
      return;
    }

    const filepath = path.join(__dirname, 'files', filename);

    switch (action) {
      case 'create':
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const { content } = JSON.parse(body);
            fs.writeFile(filepath, content, (err) => {
              if (err) {
                sendResponse(res, 500, 'Error creating file');
              } else {
                sendResponse(res, 200, `File ${filename} created successfully`);
              }
            });
          });
        } else {
          sendResponse(res, 405, 'Method Not Allowed');
        }
        break;

      case 'read':
        if (req.method === 'GET') {
          fs.readFile(filepath, 'utf8', (err, data) => {
            if (err) {
              if (err.code === 'ENOENT') {
                sendResponse(res, 404, 'File not found');
              } else {
                sendResponse(res, 500, 'Error reading file');
              }
            } else {
              sendResponse(res, 200, `Content of ${filename}: ${data}`);
            }
          });
        } else {
          sendResponse(res, 405, 'Method Not Allowed');
        }
        break;

      case 'delete':
        if (req.method === 'DELETE') {
          fs.unlink(filepath, (err) => {
            if (err) {
              if (err.code === 'ENOENT') {
                sendResponse(res, 404, 'File not found');
              } else {
                sendResponse(res, 500, 'Error deleting file');
              }
            } else {
              sendResponse(res, 200, `File ${filename} deleted successfully`);
            }
          });
        } else {
          sendResponse(res, 405, 'Method Not Allowed');
        }
        break;

      default:
        sendResponse(res, 400, 'Invalid action. Use /create, /read, or /delete followed by the filename.');
    }
  }
});

// Ensure files directory exists
const filesDir = path.join(__dirname, 'files');
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir);
}

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server starting at port ${PORT}`);
});