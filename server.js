const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "public");

const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml"
};

const server = http.createServer((request, response) => {
  // Every app route returns the shell; JavaScript selects the page module.
  const requestedPath = request.url === "/" ? "/index.html" : request.url;
  const filePath = path.join(publicDirectory, requestedPath.split("?")[0]);
  const safePath = filePath.startsWith(publicDirectory) ? filePath : "";
  const finalPath = safePath && fs.existsSync(safePath) ? safePath : path.join(publicDirectory, "index.html");

  fs.readFile(finalPath, (error, content) => {
    if (error) {
      response.writeHead(500);
      response.end("The app could not be loaded.");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(finalPath)] || "text/plain",
      "Cache-Control": "no-cache"
    });
    response.end(content);
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Local app: http://localhost:${port}`);
});
