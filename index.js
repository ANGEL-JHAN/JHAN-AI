const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const readline = require('readline')

// 🎨 colores
const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m"
}

// 🧼 limpiar
console.clear()

// 🎬 animación inicio
function loading(text, time = 2000) {
  return new Promise(resolve => {
    process.stdout.write(c.cyan + text)
    let i = 0
    const interval = setInterval(() => {
      process.stdout.write(".")
      i++
    }, 300)

    setTimeout(() => {
      clearInterval(interval)
      console.log(c.green + " ✔" + c.reset)
      resolve()
    }, time)
  })
}

// 🧠 header
console.log(c.magenta + c.bold + `
╔══════════════════════════════╗
      ⚡ JHAN AI - PRO MAX
╚══════════════════════════════╝
` + c.reset)

;(async () => {
  await loading("Iniciando sistema")
  await loading("Cargando módulos")
  await loading("Conectando a WhatsApp")

  iniciarMenu()
})()

// 📥 consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function iniciarMenu() {
  console.log("")
  rl.question(c.yellow + '1 = QR   |   2 = Código\n👉 Opción: ' + c.reset, (opcion) => {
    if (opcion.trim() === '2') {
      rl.question('📱 Número: ', (numero) => {
        startBot('2', numero.trim())
      })
    } else {
      startBot('1')
    }
  })
}

async function startBot(opcion, numero = '') {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false,
    browser: ['Android', 'Chrome', '120.0.0'],
    syncFullHistory: false
  })

  let codigoGenerado = false

  sock.ev.on('connection.update', async (update) => {
    const { qr, connection, lastDisconnect } = update

    // 📱 QR
    if (qr && opcion === '1') {
      console.log(c.cyan + '\n📱 ESCANEA EL QR\n' + c.reset)
      qrcode.generate(qr, { small: true })
    }

    // 🔐 código
    if (opcion === '2' && numero && !codigoGenerado && connection !== 'open') {
      codigoGenerado = true
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(numero)
          console.log(c.green + `\n🔐 CÓDIGO: ${code}\n` + c.reset)
        } catch {
          console.log(c.red + '❌ Error código' + c.reset)
        }
      }, 4000)
    }

    // ✅ conectado
    if (connection === 'open') {
      console.log(c.green + c.bold + '\n🚀 BOT ONLINE\n' + c.reset)
    }

    // 🔄 reconexión
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log(c.red + `❌ Reconectando (${reason})` + c.reset)

      if (reason !== DisconnectReason.loggedOut) {
        startBot(opcion, numero)
      } else {
        console.log(c.red + '🚫 Sesión cerrada' + c.reset)
      }
    }
  })

  // 💬 mensajes
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    const from = msg.key.remoteJid

    if (!texto) return

    console.log(c.cyan + '📩 ' + texto + c.reset)

    // ⚡ comandos
    if (texto === '.ping') {
      await sock.sendMessage(from, { text: '🏓 Pong!' })
    }

    if (texto === '.menu') {
      await sock.sendMessage(from, {
        text: `⚡ JHAN AI

• .ping
• .menu`
      })
    }

    if (texto === '.estado') {
      await sock.sendMessage(from, { text: '🟢 Bot activo' })
    }
  })

  sock.ev.on('creds.update', saveCreds)
}