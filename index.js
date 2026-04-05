const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  delay
} = require("@whiskeysockets/baileys")

const pino = require("pino")

const NUMERO = "51967006003" // SIN +

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

  let enviado = false

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "connecting" && !enviado) {
      enviado = true

      try {
        console.log("⏳ Esperando conexión real...\n")

        await delay(10000) // 🔥 MÁS TIEMPO = MENOS BLOQUEO

        const code = await sock.requestPairingCode(NUMERO)

        console.log(`🔐 CÓDIGO: ${code}\n`)
        console.log("📲 Ve a WhatsApp > Dispositivos vinculados > Vincular con código\n")

        await delay(30000) // 🔥 mantener vivo

      } catch (e) {
        console.log("❌ Error generando código\n")
        enviado = false
      }
    }

    if (connection === "open") {
      console.log("🚀 BOT CONECTADO\n")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...\n")
        await delay(5000)
        startSock()
      } else {
        console.log("🚫 Sesión cerrada, elimina carpeta session\n")
      }
    }
  })
}

startSock()