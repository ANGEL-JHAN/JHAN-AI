const fs = require("fs");
const path = require("path");

let plugins = {};

// 🔥 Cargar plugins
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

// 🔥 HOT RELOAD de plugins
fs.watch("./plugins", (event, filename) => {
  if (filename && filename.endsWith(".js")) {
    console.log("🔄 Plugin actualizado:", filename);
    loadPlugins();
  }
});

module.exports = async (sock, m) => {
  const msg = m.messages[0];
  if (!msg.message) return;

  for (let name in plugins) {
    try {
      await plugins[name](sock, msg);
    } catch (e) {
      console.log("❌ Error en plugin:", name);
    }
  }
};