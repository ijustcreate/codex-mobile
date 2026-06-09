const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "public");
const userDataDirectory = path.join(__dirname, "user-data");
const sessions = new Map();
const mmoPlayers = new Map();
const stopMotionDirectory = path.join(__dirname, "user-data", "_stop-motion-projects");
fs.mkdirSync(stopMotionDirectory, { recursive: true });

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

function safeUserId(username) {
  const readable = username.toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 32) || "user";
  return `${readable}-${crypto.createHash("sha256").update(username).digest("hex").slice(0, 8)}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function getUserFolders() {
  return fs.readdirSync(userDataDirectory, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => path.join(userDataDirectory, item.name));
}

function findUser(username) {
  const normalized = username.trim().toLowerCase();
  for (const folder of getUserFolders()) {
    const profilePath = path.join(folder, "profile.json");
    if (fs.existsSync(profilePath)) {
      const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
      if (profile.username === normalized) return { profile, folder };
    }
  }
  return null;
}

function publicProfile(profile) {
  return { id: profile.id, name: profile.name, username: profile.username, guest: Boolean(profile.guest), createdAt: profile.createdAt, lastLoginAt: profile.lastLoginAt };
}

function writeActivity(folder, text) {
  fs.appendFileSync(path.join(folder, "activity.log"), `${new Date().toISOString()}  ${text}\n`);
}

function sessionFrom(request) {
  const token = (request.headers.cookie || "").split(";").map(value => value.trim()).find(value => value.startsWith("session="))?.slice(8);
  return token ? sessions.get(token) : null;
}

function visitorIp(request) {
  return String(request.headers["cf-connecting-ip"] || request.headers["x-forwarded-for"] || request.socket.remoteAddress || "unknown").split(",")[0].trim();
}

function createSession(response, profile) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, profile.id);
  sendJson(response, 200, { user: publicProfile(profile) }, { "Set-Cookie": `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800` });
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/stop-motion" && request.method === "GET") {
    const id = sessionFrom(request); if (!id) return sendJson(response, 401, { error: "Not signed in." });
    const file = path.join(stopMotionDirectory, `${id}.json`);
    return sendJson(response, 200, { frames: fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [] });
  }
  if (pathname === "/api/stop-motion" && request.method === "POST") {
    const id = sessionFrom(request); if (!id) return sendJson(response, 401, { error: "Not signed in." });
    const { frames = [] } = await readBody(request); if (!Array.isArray(frames) || frames.length > 120) return sendJson(response, 400, { error: "Invalid project." });
    fs.writeFileSync(path.join(stopMotionDirectory, `${id}.json`), JSON.stringify(frames)); return sendJson(response, 200, { ok: true });
  }
  if (pathname === "/api/mmo" && request.method === "GET") {
    const id = sessionFrom(request);
    if (!id) return sendJson(response, 401, { error: "Not signed in." });
    const now = Date.now();
    for (const [playerId, player] of mmoPlayers) if (now - player.updatedAt > 15000) mmoPlayers.delete(playerId);
    return sendJson(response, 200, { players: [...mmoPlayers.values()] });
  }

  if (pathname === "/api/mmo" && request.method === "POST") {
    const id = sessionFrom(request);
    if (!id) return sendJson(response, 401, { error: "Not signed in." });
    const update = await readBody(request);
    mmoPlayers.set(id, {
      id, name: String(update.name || "Player").slice(0, 20), className: ["warrior", "rogue", "wizard"].includes(update.className) ? update.className : "warrior",
      x: Number(update.x) || 0, y: Number(update.y) || 0, level: Math.max(1, Number(update.level) || 1), updatedAt: Date.now()
    });
    return sendJson(response, 200, { ok: true });
  }
  if (pathname === "/api/register" && request.method === "POST") {
    const { username = "", password = "" } = await readBody(request);
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      return sendJson(response, 400, { error: "Choose a username." });
    }
    if (findUser(normalizedUsername)) return sendJson(response, 409, { error: "That username is already taken." });

    const id = safeUserId(normalizedUsername);
    const folder = path.join(userDataDirectory, id);
    const passwordRecord = hashPassword(password);
    const profile = { id, name: username.trim(), username: normalizedUsername, guest: false, createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() };
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, "profile.json"), JSON.stringify(profile, null, 2));
    fs.writeFileSync(path.join(folder, "private-account.json"), JSON.stringify({ passwordSalt: passwordRecord.salt, passwordHash: passwordRecord.hash }, null, 2));
    fs.writeFileSync(path.join(folder, "notes.txt"), "Maintenance notes for this user.\n");
    writeActivity(folder, "Account created");

    return createSession(response, profile);
  }

  if (pathname === "/api/login" && request.method === "POST") {
    const { username = "", password = "" } = await readBody(request);
    const user = findUser(username);
    if (!user || user.profile.guest) return sendJson(response, 401, { error: "Username or password is incorrect." });
    const privateAccount = JSON.parse(fs.readFileSync(path.join(user.folder, "private-account.json"), "utf8"));
    if (hashPassword(password, privateAccount.passwordSalt).hash !== privateAccount.passwordHash) return sendJson(response, 401, { error: "Username or password is incorrect." });

    user.profile.lastLoginAt = new Date().toISOString();
    fs.writeFileSync(path.join(user.folder, "profile.json"), JSON.stringify(user.profile, null, 2));
    writeActivity(user.folder, "Signed in");
    return createSession(response, user.profile);
  }

  if (pathname === "/api/guest" && request.method === "POST") {
    const ipHash = crypto.createHash("sha256").update(visitorIp(request)).digest("hex");
    const id = `guest-${ipHash.slice(0, 12)}`;
    const folder = path.join(userDataDirectory, id);
    const profilePath = path.join(folder, "profile.json");
    let profile;
    if (fs.existsSync(profilePath)) {
      profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
      profile.lastLoginAt = new Date().toISOString();
      writeActivity(folder, "Guest returned");
    } else {
      profile = { id, name: "Guest", username: id, guest: true, ipHash, createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() };
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, "notes.txt"), "Maintenance notes for this guest.\n");
      writeActivity(folder, "Guest profile created");
    }
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
    return createSession(response, profile);
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
