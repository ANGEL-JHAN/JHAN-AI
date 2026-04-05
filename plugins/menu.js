module.exports = async (sock, msg, text) => {
  const from = msg.key.remoteJid

  // detectar mensaje
  const body =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    ""

  if (!body.startsWith("/menu")) return

  const menu = `
╔════════════════════╗
   🤖 *AI BOT PRO MAX*
╚════════════════════╝

👋 Hola usuario

📜 *COMANDOS DISPONIBLES*

🔹 /menu → Ver menú
🔹 /ping → Estado del bot
🔹 /hola → Saludo

⚡ *SISTEMA ACTIVO*
✅ Bot encendido
✅ Conectado

╔════════════════════╗
   ANGEL OFC DEV
╚════════════════════╝
`

  await sock.sendMessage(from, { text: menu }, { quoted: msg })
}