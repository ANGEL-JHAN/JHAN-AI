const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  delay
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const readline = require("readline")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (text) => new Promise(resolve => rl.question(text, resolve))

async function startBot() {
  console.clear()

  console.log(`
╔══════════════════════════════╗
   AI - PRO MAX ⚡
╚══════════════════════════════╝
`)

  const numeroInput = await question("📱 Número (sin +): ")
  let numero = numeroInput.replace(/[^0-9]/g, "")

  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Windows", "Chrome", "122.0.0"], // 🔥 mejor compatibilidad
    logger: pino({ level: "silent" })
  })

  sock.ev.on("creds.update", saveCreds)

  let codigoGenerado = false
  let intentos = 0

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "connecting" && !codigoGenerado) {
      codigoGenerado = true

      try {
        await delay(5000) // 🔥 espera real (evita bloqueo)

        const code = await sock.requestPairingCode(numero)
        console.log(`\n🔐 CÓDIGO: ${code}\n`)

        // 🔥 mantener viva la conexión
        await delay(20000)

      } catch (e) {
        intentos++
        codigoGenerado = false

        console.log("❌ Error generando código")

        if (intentos < 3) {
          console.log("🔄 Reintentando...\n")
          await delay(8000)
        } else {
          console.log("🚫 Espera 10-30 minutos antes de intentar\n")
        }
      }
    }

    if (connection === "open") {
      console.log("🚀 BOT ONLINE\n")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando limpio...\n")
        await delay(5000)
        startBot()
      } else {
        console.log("🚫 Sesión cerrada, borra carpeta session\n")
      }
    }
  })
}

startBot()