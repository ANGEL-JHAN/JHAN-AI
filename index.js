const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
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

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '22.04.4']
  })

  let codigoGenerado = false

  sock.ev.on('connection.update', async (update) => {
    const { qr, connection, lastDisconnect } = update

    // ✅ QR SIEMPRE FUNCIONA
    if (qr && opcion === '1') {
      console.log('📱 Escanea el QR:')
      qrcode.generate(qr, { small: true })
    }

    // ✅ GENERAR CÓDIGO SOLO UNA VEZ Y CUANDO YA HAY SOCKET
    if (opcion === '2' && numero && !codigoGenerado) {
      try {
        codigoGenerado = true
        setTimeout(async () => {
          const code = await sock.requestPairingCode(numero)
          console.log('🔐 Código de vinculación:', code)
        }, 3000) // ⏳ esperar conexión estable
      } catch (err) {
        console.log('❌ Error generando código:', err)
      }
    }

    if (connection === 'open') {
      console.log('✅ BOT CONECTADO')
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log('❌ Desconectado, reconectando...', reason)

      if (reason !== DisconnectReason.loggedOut) {
        startBot(opcion, numero)
      }
    }
  })

  // 💬 Mensajes básicos
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    const from = msg.key.remoteJid

    if (!texto) return

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