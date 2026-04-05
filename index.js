const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const readline = require("readline")
const qrcode = require("qrcode-terminal")

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

  const opcion = await question("1 = QR | 2 = Código\n👉 Opción: ")

  let numero = ""
  if (opcion === "2") {
    numero = await question("📱 Número: ")
    numero = numero.replace(/[^0-9]/g, "")
  }

  const { state, saveCreds } = await useMultiFileAuthState("./session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }) // 🔥 sin logs
  })

  sock.ev.on("creds.update", saveCreds)

  let codigoGenerado = false

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update

    // QR
    if (qr && opcion === "1") {
      console.log("\n📲 ESCANEA EL QR:\n")
      qrcode.generate(qr, { small: true })
    }

    // 🔥 código en momento correcto
    if (connection === "connecting" && opcion === "2" && numero && !codigoGenerado) {
      codigoGenerado = true
      try {
        const code = await sock.requestPairingCode(numero)
        console.log(`\n🔐 CÓDIGO: ${code}\n`)
      } catch {
        console.log("❌ Error al generar código")
      }
    }

    // conectado
    if (connection === "open") {
      console.log("🚀 BOT ONLINE\n")
    }

    // desconexión
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconectando...\n")
        startBot()
      } else {
        console.log("🚫 Sesión cerrada, borra carpeta session\n")
      }
    }
  })
}

// iniciar
startBot()