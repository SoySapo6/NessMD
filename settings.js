import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"

global.botNumber = "" 

global.owner = ["51921826291"]
global.suittag = [""] 
global.prems = []

global.libreria = "@soymaycol/baileys"
global.vs = "^1.8.2|Latest"
global.sessions = "MayBots/Principal"
global.jadi = "MayBots/SubBots"
global.yukiJadibts = true

global.botname = '⊱┊ MαყBσƚ ❦'
global.textbot = 'MαყBσƚ'
global.dev = 'SσყMαყƈσʅ ⌇°•'
global.author = 'SσყMαყƈσʅ ⌇°•'
global.etiqueta = 'ˢᵒʸᵐᵃʸᶜᵒˡ'
global.currency = 'MayCoins'
global.banner = "https://files.catbox.moe/aqi8wi.png"
global.icono = "https://files.catbox.moe/ycagn5.jpeg"
global.catalogo = fs.readFileSync('./lib/catalogo.jpg')

global.group = "https://chat.whatsapp.com/JNQMGcG9jl00jYBM1iV8Jn"
global.community = "https://chat.whatsapp.com/KqkJwla1aq1LgaPiuFFtEY"
global.channel = "https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R"
global.github = "https://github.com/SoySapo6/MayBot"
global.gmail = "soymaycol.cn@gmail.com"
global.ch = {
ch1: "120363424241780448@newsletter"
}

global.APIs = {
xyro: { url: "https://api.xyro.site", key: null },
yupra: { url: "https://api.yupra.my.id", key: null },
vreden: { url: "https://api.vreden.web.id", key: null },
delirius: { url: "https://api.delirius.store", key: null },
zenzxz: { url: "https://api.zenzxz.my.id", key: null },
siputzx: { url: "https://api.siputzx.my.id", key: null },
adonix: { url: "https://api-adonix.ultraplus.click", key: 'Adofreekey' }
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
unwatchFile(file)
console.log(chalk.redBright("Update 'settings.js'"))
import(`${file}?update=${Date.now()}`)
})
