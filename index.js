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

const NUMERO = "51967006003"; // <- tu número sin +

let handler = require("./handler");

// 🔥 Auto recarga del handler
fs.watchFile(path.resolve(__dirname, "handler.js"), () => {
  console.log("♻️ Recargando handler...");
  delete require.cache[require.resolve("./handler")];
  handler = require("./handler");
});

async function startSock() {
  console.clear();
  console.log(`
╔══════════════════════════════╗
   AI - PRO MAX ⚡
╚══════════════════════════════╝
`);

  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ["Termux", "Chrome", "120.0.0"],
    logger: pino({ level: "silent" }),
    printQRInTerminal: false // ya no imprime QR automáticamente
  });

  sock.ev.on("creds.update", saveCreds);

  // Conexión
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr, pairCode } = update;

    if (connection === "connecting") console.log("🔄 Conectando...");
    if (connection === "open") console.log(`🚀 BOT ONLINE\n`);

    if (pairCode) console.log(`🔐 CÓDIGO: ${pairCode} (vincula en WhatsApp)`);

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...");
        await delay(4000);
        startSock();
      } else {
        console.log("🚫 Sesión cerrada, borra carpeta session");
      }
    }
  });

  // Mensajes
  sock.ev.on("messages.upsert", async (m) => {
    handler(sock, m);
  });

  // Mensaje inicial con número
  console.log(`📱 Número: ${NUMERO}`);
}

startSock();