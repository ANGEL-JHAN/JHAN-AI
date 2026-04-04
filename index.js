const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const readline = require('readline')

// 📥 consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 🔘 menú
rl.question('Elige método:\n1 = QR\n2 = Código\n👉 Opción: ', (opcion) => {
  if (opcion.trim() === '2') {
    rl.question('📱 Ingresa tu número (sin +): ', (numero) => {
      startBot(opcion.trim(), numero.trim())
    })
  } else {
    startBot('1')
  }
})

async function startBot(opcion, numero = '') {
  const { state, saveCreds } = await useMultiFileAuthState('auth')

  // 🔥 versión compatible automática
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

    // ✅ QR
    if (qr && opcion === '1') {
      console.log('\n📱 Escanea este QR:\n')
      qrcode.generate(qr, { small: true })
    }

    // ✅ Código (espera conexión estable)
    if (opcion === '2' && numero && !codigoGenerado) {
      try {
        codigoGenerado = true
        setTimeout(async () => {
          const code = await sock.requestPairingCode(numero)
          console.log('\n🔐 Código de vinculación:', code, '\n')
        }, 4000)
      } catch (err) {
        console.log('❌ Error generando código:', err)
      }
    }

    // ✅ conectado
    if (connection === 'open') {
      console.log('✅ BOT CONECTADO')
    }

    // 🔄 reconexión
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log('❌ Desconectado, reconectando...', reason)

      if (reason !== DisconnectReason.loggedOut) {
        startBot(opcion, numero)
      } else {
        console.log('🚫 Sesión cerrada, elimina auth y vuelve a iniciar')
      }
    }
  })

  // 💬 comandos básicos
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    const from = msg.key.remoteJid

    if (!texto) return

    console.log('📩 Mensaje:', texto)

    if (texto === '.ping') {
      await sock.sendMessage(from, { text: '🏓 Pong!' })
    }

    if (texto === '.menu') {
      await sock.sendMessage(from, {
        text: `🤖 *MENÚ*

• .ping
• .menu`
      })
    }
  })

  sock.ev.on('creds.update', saveCreds)
}