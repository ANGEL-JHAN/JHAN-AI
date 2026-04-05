// handler.js
const fs = require("fs");
const path = require("path");

let plugins = {};

// 🔥 Función para cargar todos los plugins
function loadPlugins() {
  plugins = {};
  const files = fs.readdirSync("./plugins");
  for (let file of files) {
    if (!file.endsWith(".js")) continue;
    const filePath = path.join(__dirname, "plugins", file);
    delete require.cache[require.resolve(filePath)];
    plugins[file] = require(filePath);
  }
  console.log("♻️ Plugins cargados:", Object.keys(plugins).length);
}

// Primera carga
loadPlugins();

// 🔥 Hot reload de plugins
fs.watch("./plugins", (event, filename) => {
  if (filename && filename.endsWith(".js")) {
    console.log("🔄 Plugin actualizado:", filename);
    loadPlugins();
  }
});

/**
 * handler principal
 * @param {import('@whiskeysockets/baileys').AnyWASocket} sock
 * @param {import('@whiskeysockets/baileys').proto.IWebMessageInfo[]} m
 */
module.exports = async (sock, m) => {
  const msg = m.messages?.[0];
  if (!msg || !msg.message) return;

  const from = msg.key.remoteJid;
  const text = msg.message.conversation || "";

  // Ejecutar cada plugin
  for (let name in plugins) {
    try {
      await plugins[name](sock, msg, from, text);
    } catch (e) {
      console.log("❌ Error en plugin:", name, e);
    }
  }
};