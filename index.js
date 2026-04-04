const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  // 📡 Conexión
  sock.ev.on('connection.update', (update) => {
    const { qr, connection, lastDisconnect } = update

    if (qr) {
      console.log('📱 Escanea el QR:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ BOT CONECTADO')
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log('❌ Desconectado, reconectando...', reason)

      if (reason !== DisconnectReason.loggedOut) {
        startBot()
      }
    }
  })

  // 💬 Mensajes
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const texto =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    const from = msg.key.remoteJid

    if (!texto) return

    console.log('📩 Mensaje:', texto)

    // 🔥 COMANDOS
    if (texto === '.ping') {
      await sock.sendMessage(from, { text: '🏓 Pong!' })
    }

    if (texto === '.menu') {
      await sock.sendMessage(from, {
        text: `🤖 *MENÚ*

• .ping
• .menu

✨ Bot activo`
      })
    }
  })

  sock.ev.on('creds.update', saveCreds)
}

startBot()