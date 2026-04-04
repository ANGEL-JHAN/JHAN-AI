const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const readline = require('readline')

// 📥 consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 🔘 menú principal
rl.question('Elige método:\n1 = QR\n2 = Código\n👉 Opción: ', (opcion) => {
  if (opcion.trim() === '2') {
    rl.question('📱 Ingresa tu número (sin +): ', (numero) => {
      startBot(opcion.trim(), numero.trim())
    })
  } else {
    startBot(opcion.trim())
  }
})

async function startBot(opcion, numero = '') {
  const { state, saveCreds } = await useMultiFileAuthState('auth')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Android', 'Chrome', '120.0.0']
  })

  sock.ev.on('connection.update', async (update) => {
    const { qr, connection, lastDisconnect } = update

    // 🔹 QR
    if (qr && opcion === '1') {
      console.log('📱 Escanea el QR:')
      qrcode.generate(qr, { small: true })
    }

    // 🔹 Código
    if (connection === 'connecting' && opcion === '2' && numero) {
      try {
        const code = await sock.requestPairingCode(numero)
        console.log('🔐 Código de vinculación:', code)
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

  sock.ev.on('creds.update', saveCreds)
}