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
    browser: ["Ubuntu", "Chrome", "120.0.0"], // 🔥 clave anti bloqueo
    logger: pino({ level: "silent" })
  })

  sock.ev.on("creds.update", saveCreds)

  let intentos = 0
  let codigoGenerado = false

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "connecting" && !codigoGenerado) {
      codigoGenerado = true

      try {
        await delay(3000) // 🔥 espera antes de pedir código

        const code = await sock.requestPairingCode(numero)
        console.log(`\n🔐 CÓDIGO: ${code}\n`)

      } catch (e) {
        console.log("❌ Error generando código")

        intentos++
        codigoGenerado = false

        if (intentos < 3) {
          console.log("🔄 Reintentando...\n")
          await delay(5000)
        } else {
          console.log("🚫 Demasiados intentos, espera 10 min\n")
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
        startBot()
      } else {
        console.log("🚫 Sesión cerrada, borra carpeta session\n")
      }
    }
  })
}

startBot()