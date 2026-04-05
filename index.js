const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  delay
} = require("@whiskeysockets/baileys")

const pino = require("pino")

async function startSock() {
  console.clear()

  console.log(`
╔══════════════════════════════╗
   AI - PRO MAX ⚡
╚══════════════════════════════╝
`)

  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true, // 🔥 QR automático
    browser: ["Windows", "Chrome", "122.0.0"],
    logger: pino({ level: "silent" })
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "connecting") {
      console.log("🔄 Conectando...\n")
    }

    if (connection === "open") {
      console.log("🚀 BOT ONLINE (YA VINCULADO)\n")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando automático...\n")
        await delay(4000)
        startSock() // 🔥 solo socket, limpio
      } else {
        console.log("🚫 Sesión cerrada, elimina carpeta session\n")
      }
    }
  })

  // 👇 EJEMPLO DE BOT (RESPONDE)
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    if (!texto) return

    if (texto.toLowerCase() === "hola") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "👋 Hola, soy tu bot PRO MAX ⚡"
      })
    }
  })
}

startSock()