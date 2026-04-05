const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  delay
} = require("@whiskeysockets/baileys")

const pino = require("pino")

// 🔥 TU NÚMERO AQUÍ (SIN +)
const NUMERO = "51967006003"

async function startSock() {
  console.clear()

  console.log(`
╔══════════════════════════════╗
   AI - PRO MAX ⚡ (PAIR CODE)
╚══════════════════════════════╝
`)

  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ["Windows", "Chrome", "122.0.0"],
    logger: pino({ level: "silent" })
  })

  sock.ev.on("creds.update", saveCreds)

  let codigoEnviado = false

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "connecting" && !codigoEnviado) {
      codigoEnviado = true

      try {
        console.log("⏳ Generando código...\n")

        // 🔥 CLAVE: esperar handshake real
        await delay(8000)

        const code = await sock.requestPairingCode(NUMERO)

        console.log(`🔐 CÓDIGO: ${code}\n`)
        console.log("📲 Ve a WhatsApp > Dispositivos vinculados > Vincular con código\n")

        // 🔥 mantener vivo (clave anti cierre)
        await delay(25000)

      } catch (e) {
        console.log("❌ Error generando código\n")
        codigoEnviado = false
      }
    }

    if (connection === "open") {
      console.log("🚀 BOT CONECTADO (VINCULADO)\n")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...\n")
        await delay(5000)
        startSock()
      } else {
        console.log("🚫 Sesión cerrada, borra carpeta session\n")
      }
    }
  })
}

startSock()