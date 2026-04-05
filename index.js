// index.js
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  delay
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Banner en colores
function banner() {
  console.log(`
\x1b[36m╔════════════════════════════════╗
\x1b[35m      JHAN AI
\x1b[33m           BOT
\x1b[32m   Creadores: ANGEL OFC & TEAM
\x1b[36m╚════════════════════════════════╝\x1b[0m
`);
}

// Preguntar número al iniciar
async function askNumber() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question("📱 Ingresa tu número (sin +): ", num => {
      rl.close();
      resolve(num);
    });
  });
}

// 🔥 Auto recarga del handler
let handler = require("./handler.js");
fs.watchFile(path.resolve(__dirname, "handler.js"), () => {
  console.log("♻️ Recargando handler...");
  delete require.cache[require.resolve("./handler.js")];
  handler = require("./handler.js");
});

async function startBot() {
  console.clear();
  banner();

  const NUMERO = await askNumber();
  console.log(`\n✅ Número configurado: ${NUMERO}\n`);

  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["JHAN AI", "Chrome", "120.0.0"],
    printQRInTerminal: true // importante para ver el QR/pair code
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async update => {
    const { connection, lastDisconnect, qr, pairCode } = update;

    if (connection === "connecting") console.log("🔄 Conectando...");
    if (connection === "open") console.log("🚀 BOT ONLINE");

    if (pairCode) console.log(`🔐 CÓDIGO DE 8 DÍGITOS: ${pairCode} (vincula WhatsApp)`);

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando en 4s...");
        await delay(4000);
        startBot();
      } else {
        console.log("🚫 Sesión cerrada, borra la carpeta 'session' para reiniciar");
      }
    }
  });

  sock.ev.on("messages.upsert", async m => {
    handler(sock, m);
  });
}

startBot();