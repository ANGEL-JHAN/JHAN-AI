module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid

  const body =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    ""

  if (body === "/reload") {
    try {
      loadPlugins()
      await sock.sendMessage(from, { text: "♻️ Plugins recargados" }, { quoted: msg })
    } catch {
      await sock.sendMessage(from, { text: "❌ Error al recargar" }, { quoted: msg })
    }
  }
}