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
const chalk = require("chalk");
const readline = require("readline");

let handler = require("./handler");

// 🔥 Auto recarga del handler
fs.watchFile(path.resolve(__dirname, "handler.js"), () => {
  console.log(chalk.yellow("♻️  Recargando handler..."));
  delete require.cache[require.resolve("./handler")];
  handler = require("./handler");
});

// 🎨 Banner inicial
function printBanner() {
  console.clear();
  console.log(`
${chalk.red.bold("██████╗ ██╗ ██████╗ ███╗   ██╗")}
${chalk.yellow.bold("██╔══██╗██║██╔═══██╗████╗  ██║")}
${chalk.green.bold("██████╔╝██║██║   ██║██╔██╗ ██║")}
${chalk.cyan.bold("██╔═══╝ ██║██║   ██║██║╚██╗██║")}
${chalk.magenta.bold("██║     ██║╚██████╔╝██║ ╚████║")}
${chalk.blue.bold("╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝")}

${chalk.bold.green("       JHAN AI")}
${chalk.bold.cyan("          BOT")}
${chalk.bold.yellow("     Creadores: ANGEL OFC & JHAN")}
`);
}

// Función para pedir número al usuario
function askNumber() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(chalk.blue("📱 Ingresa tu número de WhatsApp (ej: 51967006003): "), (numero) => {
      rl.close();
      resolve(numero.trim());
    });
  });
}

async function startSock() {
  printBanner();

  const NUMERO = await askNumber();

  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ["Replit", "Chrome", "120.0.0"],
    logger: pino({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  // Conexión
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr, pairCode } = update;

    if (connection === "connecting") console.log(chalk.blue("🔄 Conectando..."));
    if (connection === "open") console.log(chalk.green(`🚀 BOT ONLINE\n`));

    if (pairCode) console.log(chalk.yellow(`🔐 CÓDIGO: ${pairCode} (vincula en WhatsApp)`));

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log(chalk.red("🔄 Reconectando..."));
        await delay(4000);
        startSock();
      } else {
        console.log(chalk.red("🚫 Sesión cerrada, borra la carpeta session"));
      }
    }
  });

  // Mensajes
  sock.ev.on("messages.upsert", async (m) => {
    handler(sock, m);
  });

  // Mensaje inicial con número
  console.log(chalk.magenta(`📱 Número ingresado: ${NUMERO}`));
}

startSock();