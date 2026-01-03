import { createHash } from 'crypto'
import fetch from 'node-fetch'
import { FormData, Blob } from 'formdata-node'
import { fileTypeFromBuffer } from 'file-type'
import crypto from 'crypto'
import axios from 'axios'
import cheerio from 'cheerio'
import qs from 'qs'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

const toStyled = (text) => {
const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const styled = "αႦƈԃҽϝɠԋιʝƙʅɱɳσρϙɾʂƚυʋɯxყȥABCDEFGHIJKLMNOPQRSTUVWXYZ"
return text.split('').map(char => {
const i = normal.indexOf(char)
return i !== -1 ? styled[i] : char
}).join('')
}

const handler = async (m, { conn, command, usedPrefix, text, args }) => {
try {
let q = m.quoted ? m.quoted : m
let mime = (q.msg || q).mimetype || ''
if (!mime) return conn.reply(m.chat, toStyled('por favor responde a una imagen o video'), m)

await m.react('🕒')
const media = await q.download()
const isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime)
const fileSize = formatBytes(media.length)

if (args[0]) {
let link = ''
let serverName = ''

switch (args[0].toLowerCase()) {
case 'catbox':
serverName = 'CαƚႦσx'
link = await catbox(media)
break
case 'wpfastest':
serverName = 'WρFαʂƚҽʂƚ'
link = await wpfastestcache(media)
break
case 'mediafire':
serverName = 'Mҽԃιαϝιɾҽ'
link = await mediafireUpload(media, mime)
break
case 'litter':
serverName = 'Lιƚƚҽɾ'
link = await litterUpload(media)
break
case 'neveloopp':
serverName = 'Nҽʋҽʅσσρρ'
link = await neveloopp(media)
break
default:
return m.reply(toStyled('Servicio no valido'))
}

if (!link) return m.reply(toStyled('Error al subir el archivo'))

const txt = `•——————•°•✿•°•——————•
╰┈➤ Uρʅσαԃ Sҽɾʋιƈҽ ⌇°•
●～●～●～●～●～●～●～●～

➮ Sҽɾʋιԃσɾ: °❀ *${serverName}*
➮ Tαɱαñσ: °❀ *${fileSize}*
➮ Exριɾα: °❀ *${isTele ? 'Nσ ҽxριɾα' : 'Dҽʂƈσɳσƈιԃσ'}*

ׂ╰┈➤ *Eɳʅαƈҽ ԃιɾҽƈƚσ αႦαʝσ*`

await conn.sendMessage(m.chat, {
text: txt,
buttons: [
{
buttonId: 'url',
buttonText: { displayText: '[ 🔗 ] Iɾ αʅ Eɳʅαƈҽ' },
type: 1,
url: link
}
],
headerType: 1,
viewOnce: true
}, { quoted: m })
await m.react('✔️')

} else {
const menuText = `•——————•°•✿•°•——————•
╰┈➤ Sҽʅҽƈƈισɳα Sҽɾʋιԃσɾ ⌇°•
●～●～●～●～●～●～●～●～

Rҽʂρσɳԃҽ ƈσɳ ҽʅ ɳσɱႦɾҽ ԃҽʅ ʂҽɾʋιԃσɾ
σ ρɾҽʂισɳα ʅσʂ Ⴆσƚσɳҽʂ

1. CαƚႦσx
2. WρFαʂƚҽʂƚ
3. Mҽԃιαϝιɾҽ
4. Lιƚƚҽɾ
5. Nҽʋҽʅσσρρ`

await conn.sendMessage(m.chat, {
text: menuText,
buttons: [
{ buttonId: `${usedPrefix + command} catbox`, buttonText: { displayText: 'CαƚႦσx' }, type: 1 },
{ buttonId: `${usedPrefix + command} wpfastest`, buttonText: { displayText: 'WρFαʂƚҽʂƚ' }, type: 1 },
{ buttonId: `${usedPrefix + command} mediafire`, buttonText: { displayText: 'Mҽԃιαϝιɾҽ' }, type: 1 },
{ buttonId: `${usedPrefix + command} litter`, buttonText: { displayText: 'Lιƚƚҽɾ' }, type: 1 },
{ buttonId: `${usedPrefix + command} neveloopp`, buttonText: { displayText: 'Nҽʋҽʅσσρρ' }, type: 1 }
],
headerType: 1
}, { quoted: m })
}

} catch (error) {
await m.react('✖️')
console.error(error)
await conn.reply(m.chat, toStyled(`Error: ${error.message}`), m)
}
}

handler.help = ['tourl']
handler.tags = ['tools']
handler.command = ['tourl', 'upload']

export default handler

function formatBytes(bytes) {
if (bytes === 0) return '0 B'
const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
const i = Math.floor(Math.log(bytes) / Math.log(1024))
return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`
}

async function catbox(content) {
const { ext, mime } = (await fileTypeFromBuffer(content)) || {}
const blob = new Blob([content], { type: mime })
const formData = new FormData()
const randomBytes = crypto.randomBytes(5).toString("hex")
formData.append("reqtype", "fileupload")
formData.append("fileToUpload", blob, randomBytes + "." + ext)
const response = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: formData, headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)" }})
return await response.text()
}

async function wpfastestcache(buffer) {
const { ext, mime } = await fileTypeFromBuffer(buffer) || { ext: 'txt', mime: 'text/plain' }
const formData = new FormData()
const filename = `${crypto.randomBytes(5).toString('hex')}.${ext}`
const blob = new Blob([buffer], { type: mime })
formData.append("fileToUpload", blob, filename)
const response = await fetch("https://img-tr.wpfc.ml/yukle.php", {
method: "POST",
body: formData,
headers: {
"Accept": "/",
"User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
"Referer": "https://www.wpfastestcache.com/es/subir-imagen/",
"Origin": "https://www.wpfastestcache.com",
"Upgrade-Insecure-Requests": "1"
}
})
const data = await response.json()
return data.url
}

async function neveloopp(buffer) {
const { ext, mime } = await fileTypeFromBuffer(buffer) || { ext: 'bin', mime: 'application/octet-stream' }
const formData = new FormData()
const filename = `${crypto.randomBytes(8).toString('hex')}.${ext}`
const blob = new Blob([buffer], { type: mime })
formData.append("file", blob, filename)
const response = await fetch("https://cdn-neveloopp.ultraplus.click/upload", {
method: "POST",
body: formData,
headers: { "Accept": "application/json" }
})
const data = await response.json()
return data.url
}

async function litterUpload(buffer) {
const { ext, mime } = await fileTypeFromBuffer(buffer) || { ext: 'bin', mime: 'application/octet-stream' }
const form = new FormData()
const filename = `${crypto.randomBytes(5).toString('hex')}.${ext}`
const blob = new Blob([buffer], { type: mime })
form.append("file", blob, filename)
form.append("expireAfter", "99999999999999")
form.append("burn", "false")
const token = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
const r = (Math.random() * 16) | 0
return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
})
const response = await axios.post(
"https://litter.lusia.moe/post/upload",
form,
{
params: { token },
headers: {
"authority": "litter.lusia.moe",
"accept": "application/json, text/plain, /",
"origin": "https://litter.lusia.moe",
"referer": "https://litter.lusia.moe/",
"user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36"
}
}
)
return `https://litter.lusia.moe/${response.data.path}`
}

async function mediafireUpload(buffer, mimetype) {
const { ext } = await fileTypeFromBuffer(buffer) || { ext: 'bin' }
const filename = `file_${crypto.randomBytes(4).toString('hex')}.${ext}`
const jar = new CookieJar()
const client = wrapper(axios.create({ jar, withCredentials: true, timeout: 30000, headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" } }))

const getSecurity = async () => {
const res = await client.get("https://www.mediafire.com/upgrade/registration.php?pid=free", { headers: { Accept: "text/html" } })
const $ = cheerio.load(res.data)
return $('input[name="security"]').val()
}

const registerAccount = async (security) => {
const email = `${crypto.randomBytes(4).toString('hex')}@baguss.xyz`
const payload = qs.stringify({
security,
reg_first_name: "User",
reg_last_name: "Temp",
reg_email: email,
reg_pass: "bagusapi2134",
agreement: "3.25",
pid: "free",
signup_continue: "Create Account & Continue"
})
const res = await client.post("https://www.mediafire.com/dynamic/register_gopro.php", payload, {
headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://www.mediafire.com", Referer: "https://www.mediafire.com/upgrade/registration.php?pid=free" }
})
if (res.data?.status !== "success" || !res.data?.session_token) throw new Error("REGISTER_FAILED")
return res.data.session_token
}

const uploadLegacy = async (sessionToken) => {
const form = new FormData()
const blob = new Blob([buffer], { type: mimetype })
form.append("filename", blob, filename)
form.append("uploadapi", "yes")
form.append("response_format", "json")
const init = await axios.post("https://www.mediafire.com/api/upload/upload.php?session_token=" + encodeURIComponent(sessionToken), form, {
headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" },
maxBodyLength: Infinity
})
const raw = typeof init.data === "string" ? init.data : JSON.stringify(init.data)
const keyMatch = raw.match(/<key>(.*?)<\/key>/i)
if (!keyMatch) throw new Error("UPLOAD_KEY_NOT_FOUND")
const key = keyMatch[1]
while (true) {
await new Promise(r => setTimeout(r, 1500))
const poll = await axios.post("https://www.mediafire.com/api/upload/poll_upload.php?session_token=" + encodeURIComponent(sessionToken), qs.stringify({ key, response_format: "json" }), {
headers: { "Content-Type": "application/x-www-form-urlencoded" }
})
const data = poll?.data?.response?.doupload
if (data?.status === "99") return `https://www.mediafire.com/file/${data.quickkey || key}/${encodeURIComponent(filename)}`
}
}
const security = await getSecurity()
const session_token = await registerAccount(security)
return await uploadLegacy(session_token)
}
