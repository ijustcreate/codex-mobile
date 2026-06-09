const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "public");
const userDataDirectory = path.join(__dirname, "user-data");
const sessions = new Map();

const contentTypes = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml" };
fs.mkdirSync(userDataDirectory, { recursive: true });

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json", ...headers });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 100_000) request.destroy();
    });
    request.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); } catch (error) { reject(error); }
    });
  });
}

function safeUserId(email) {
  const readable = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 32) || "user";
  return `${readable}-${crypto.createHash("sha256").update(email).digest("hex").slice(0, 8)}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function getUserFolders() {
  return fs.readdirSync(userDataDirectory, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => path.join(userDataDirectory, item.name));
}

function findUser(email) {
  const normalized = email.trim().toLowerCase();
  for (const folder of getUserFolders()) {
    const profilePath = path.join(folder, "profile.json");
    if (fs.existsSync(profilePath)) {
      const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
      if (profile.email === normalized) return { profile, folder };
    }
  }
  return null;
}

function publicProfile(profile) {
  return { id: profile.id, name: profile.name, email: profile.email, createdAt: profile.createdAt, lastLoginAt: profile.lastLoginAt };
}

function writeActivity(folder, text) {
  fs.appendFileSync(path.join(folder, "activity.log"), `${new Date().toISOString()}  ${text}\n`);
}

function sessionFrom(request) {
  const token = (request.headers.cookie || "").split(";").map(value => value.trim()).find(value => value.startsWith("session="))?.slice(8);
  return token ? sessions.get(token) : null;
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/register" && request.method === "POST") {
    const { name = "", email = "", password = "" } = await readBody(request);
    const normalizedEmail = email.trim().toLowerCase();
    if (name.trim().length < 2 || !normalizedEmail.includes("@") || password.length < 8) {
      return sendJson(response, 400, { error: "Use a name, valid email, and password of at least 8 characters." });
    }
    if (findUser(normalizedEmail)) return sendJson(response, 409, { error: "An account already exists for that email." });

    const id = safeUserId(normalizedEmail);
    const folder = path.join(userDataDirectory, id);
    const passwordRecord = hashPassword(password);
    const profile = { id, name: name.trim(), email: normalizedEmail, createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() };
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, "profile.json"), JSON.stringify(profile, null, 2));
    fs.writeFileSync(path.join(folder, "private-account.json"), JSON.stringify({ passwordSalt: passwordRecord.salt, passwordHash: passwordRecord.hash }, null, 2));
    fs.writeFileSync(path.join(folder, "notes.txt"), "Maintenance notes for this user.\n");
    writeActivity(folder, "Account created");

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, profile.id);
    return sendJson(response, 201, { user: publicProfile(profile) }, { "Set-Cookie": `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800` });
  }

  if (pathname === "/api/login" && request.method === "POST") {
    const { email = "", password = "" } = await readBody(request);
    const user = findUser(email);
    if (!user) return sendJson(response, 401, { error: "Email or password is incorrect." });
    const privateAccount = JSON.parse(fs.readFileSync(path.join(user.folder, "private-account.json"), "utf8"));
    if (hashPassword(password, privateAccount.passwordSalt).hash !== privateAccount.passwordHash) return sendJson(response, 401, { error: "Email or password is incorrect." });

    user.profile.lastLoginAt = new Date().toISOString();
    fs.writeFileSync(path.join(user.folder, "profile.json"), JSON.stringify(user.profile, null, 2));
    writeActivity(user.folder, "Signed in");
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, user.profile.id);
    return sendJson(response, 200, { user: publicProfile(user.profile) }, { "Set-Cookie": `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800` });
  }

  if (pathname === "/api/me" && request.method === "GET") {
    const id = sessionFrom(request);
    if (!id) return sendJson(response, 401, { error: "Not signed in." });
    const profilePath = path.join(userDataDirectory, id, "profile.json");
    if (!fs.existsSync(profilePath)) return sendJson(response, 401, { error: "Account not found." });
    return sendJson(response, 200, { user: publicProfile(JSON.parse(fs.readFileSync(profilePath, "utf8"))) });
  }

  if (pathname === "/api/logout" && request.method === "POST") {
    return sendJson(response, 200, { ok: true }, { "Set-Cookie": "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" });
  }

  sendJson(response, 404, { error: "API route not found." });
}

function serveStatic(request, response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(publicDirectory, requestedPath);
  const safePath = filePath.startsWith(publicDirectory) ? filePath : "";
  const finalPath = safePath && fs.existsSync(safePath) ? safePath : path.join(publicDirectory, "index.html");
  fs.readFile(finalPath, (error, content) => {
    if (error) return response.end("The app could not be loaded.");
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(finalPath)] || "text/plain", "Cache-Control": "no-cache" });
    response.end(content);
  });
}

http.createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  try {
    if (pathname.startsWith("/api/")) await handleApi(request, response, pathname);
    else serveStatic(request, response, pathname);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Something went wrong." });
  }
}).listen(port, "0.0.0.0", () => console.log(`Local app: http://localhost:${port}`));
