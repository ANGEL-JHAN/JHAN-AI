module.exports = async (sock, msg) => {
  const from = msg.key.remoteJid;
  const body =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  if (body.toLowerCase().trim() === "/menu") {
    const menu = `
╔════════════════════╗
   🤖 AI BOT PRO MAX
╚════════════════════╝

📜 COMANDOS DISPONIBLES

🔹 /menu      - Mostrar este menú
🔹 /ping      - Verificar bot
🔹 /hola      - Saludar al bot
`;

    await sock.sendMessage(from, { text: menu }, { quoted: msg });
  }
};