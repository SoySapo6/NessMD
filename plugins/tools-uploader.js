import { createHash } from 'crypto'
import fetch from 'node-fetch'
import { FormData, Blob } from 'formdata-node'
import { fileTypeFromBuffer } from 'file-type'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import os from 'os'
import axios from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'
import cheerio from 'cheerio'
import qs from 'qs'

const handler = async (m, { conn, command, usedPrefix, args }) => {
    try {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        if (!mime) return conn.reply(m.chat, '⊱┊ ℙ𝕠𝕣 𝕗𝕒𝕧𝕠𝕣 𝕣𝕖𝕤𝕡𝕠𝕟𝕕𝕖 𝕒 𝕦𝕟 𝕒𝕣𝕔𝕙𝕚𝕧𝕠 𝕠 𝕚𝕞𝕒𝕘𝕖𝕟', m)

        const toStyled = (text) => {
            const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            const styled = "αႦƈԃҽϝɠԋιʝƙʅɱɳσρϙɾʂƚυʋɯxყȥΑΒCDEFGHIJKLMNOPQRSTUVWXYZ"
            return text.split('').map(char => {
                let i = normal.indexOf(char)
                return i !== -1 ? styled[i] : char
            }).join('')
        }

        if (!args[0]) {
            const sections = [
                {
                    title: "⊱┊ 𝕊𝕖𝕣𝕧𝕚𝕔𝕚𝕠𝕤 𝕕𝕖 𝕀𝕞𝕒𝕘𝕖𝕟",
                    rows: [
                        { title: "ℂ𝕒𝕥𝕓𝕠𝕩", rowId: `${usedPrefix}${command} catbox`, description: "𝕊𝕦𝕓𝕚𝕕𝕒 𝕣𝕒𝕡𝕚𝕕𝕒 𝕤𝕚𝕟 𝕖𝕩𝕡𝕚𝕣𝕒𝕔𝕚𝕠𝕟" },
                        { title: "𝕎ℙ𝔽𝕒𝕤𝕥𝕖𝕤𝕥", rowId: `${usedPrefix}${command} wpfastest`, description: "𝕊𝕠𝕝𝕠 𝕀𝕞𝕒𝕘𝕖𝕟𝕖𝕤" },
                        { title: "𝕋𝕖𝕝𝕖𝕘𝕣𝕒𝕡𝕙", rowId: `${usedPrefix}${command} telegraph`, description: "ℂ𝕝𝕒𝕤𝕚𝕔𝕠" }
                    ]
                },
                {
                    title: "⊱┊ 𝕊𝕖𝕣𝕧𝕚𝕔𝕚𝕠𝕤 𝕕𝕖 𝔸𝕣𝕔𝕙𝕚𝕧𝕠𝕤",
                    rows: [
                        { title: "𝕄𝕖𝕕𝕚𝕒𝕗𝕚𝕣𝕖", rowId: `${usedPrefix}${command} mediafire`, description: "𝔸𝕣𝕔𝕙𝕚𝕧𝕠𝕤 𝕕𝕖 𝕔𝕦𝕒𝕝𝕢𝕦𝕚𝕖𝕣 𝕥𝕚𝕡𝕠" },
                        { title: "𝕃𝕚𝕥𝕥𝕖𝕣𝔹𝕠𝕩", rowId: `${usedPrefix}${command} litter`, description: "𝕋𝕖𝕞𝕡𝕠𝕣𝕒𝕝" },
                        { title: "ℕ𝕖𝕧𝕖𝕝𝕠𝕠𝕡", rowId: `${usedPrefix}${command} neveloopp`, description: "ℂ𝔻ℕ 𝕌𝕝𝕥𝕣𝕒𝕡𝕝𝕦𝕤" }
                    ]
                }
            ]

            const listMessage = {
                text: `•——————•°•✿•°•——————•
╰┈➤ 𝕌ℙ𝕃𝕆𝔸𝔻 ℂ𝔼ℕ𝕋𝔼ℝ ⌇°•
⊱┊ 𝕊𝕖𝕝𝕖𝕔𝕔𝕚𝕠𝕟𝕒 𝕦𝕟 𝕤𝕖𝕣𝕧𝕚𝕕𝕠𝕣
●～●～●～●～●～●～●～●～

➮ 𝔸𝕣𝕔𝕙𝕚𝕧𝕠: °❀ *${mime}*
➮ 𝕋𝕒𝕞𝕒ñ𝕠: °❀ *${q.msg?.fileLength ? formatBytes(q.msg.fileLength) : '𝔻𝕖𝕤𝕔𝕠𝕟𝕠𝕔𝕚𝕕𝕠'}*

↶*ೃ✧˚. ❃ ↷ ˊ-`,
                footer: "⊱┊ MαყBσƚ ᵇʸ ˢᵒʸᵐᵃʸᶜᵒˡ ❦",
                title: "☁️ 𝕊𝕖𝕝𝕖𝕔𝕥𝕠𝕣 𝕕𝕖 ℕ𝕦𝕓𝕖",
                buttonText: "⊱┊ ℍ𝕒𝕫 ℂ𝕝𝕚𝕔 𝔸𝕢𝕦𝕚",
                sections
            }
            return await conn.sendMessage(m.chat, listMessage, { quoted: m })
        }

        await m.react('🕒')
        const media = await q.download()
        let link = ''
        let serviceName = ''

        switch (args[0].toLowerCase()) {
            case 'catbox':
                serviceName = 'ℂ𝕒𝕥𝕓𝕠𝕩'
                link = await catbox(media)
                break
            case 'wpfastest':
                serviceName = '𝕎ℙ𝔽𝕒𝕤𝕥𝕖𝕤𝕥'
                link = await wpFastest(media)
                break
            case 'mediafire':
                serviceName = '𝕄𝕖𝕕𝕚𝕒𝕗𝕚𝕣𝕖'
                link = await mediaFire(media, mime)
                break
            case 'litter':
                serviceName = '𝕃𝕚𝕥𝕥𝕖𝕣𝔹𝕠𝕩'
                link = await litter(media)
                break
            case 'neveloopp':
                serviceName = 'ℕ𝕖𝕧𝕖𝕝𝕠𝕠𝕡'
                link = await neveloopp(media)
                break
            case 'telegraph':
            default:
                serviceName = '𝕋𝕖𝕝𝕖𝕘𝕣𝕒𝕡𝕙'
                link = await uploadImage(media)
                break
        }

        if (!link) throw new Error('Error al subir el archivo')

        const txt = `•——————•°•✿•°•——————•
╰┈➤ ℝ𝔼𝕊𝕌𝕃𝕋𝔸𝔻𝕆 ⌇°•
⊱┊ 𝕊𝕖𝕣𝕧𝕚𝕕𝕠𝕣: ${serviceName}
●～●～●～●～●～●～●～●～

➮ 𝕌ℝ𝕃: °❀ ${link}
➮ 𝕋𝕒𝕞𝕒ñ𝕠: °❀ ${formatBytes(media.length)}

↶*ೃ✧˚. ❃ ↷ ˊ-`

        await conn.sendMessage(m.chat, {
            text: txt,
            buttons: [
                {
                    buttonId: 'url',
                    buttonText: { displayText: '⊱┊ 𝕀𝕣 𝕒𝕝 𝔼𝕟𝕝𝕒𝕔𝕖' },
                    type: 1,
                    url: link
                }
            ],
            headerType: 1,
            viewOnce: true
        }, { quoted: m })

        await m.react('✔️')

    } catch (error) {
        await m.react('✖️')
        console.error(error)
        await conn.reply(m.chat, `⚠︎ 𝕆𝕔𝕦𝕣𝕣𝕚𝕠 𝕦𝕟 𝕖𝕣𝕣𝕠𝕣\n> ${error.message}`, m)
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

async function uploadImage(buffer) {
    const { ext } = await fileTypeFromBuffer(buffer)
    let form = new FormData()
    form.append('file', new Blob([buffer]), 'tmp.' + ext)
    let res = await fetch('https://telegra.ph/upload', {
        method: 'POST',
        body: form
    })
    let img = await res.json()
    if (img.error) throw img.error
    return 'https://telegra.ph' + img[0].src
}

async function catbox(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || {}
    const blob = new Blob([content], { type: mime })
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(5).toString("hex")
    formData.append("reqtype", "fileupload")
    formData.append("fileToUpload", blob, randomBytes + "." + ext)
    const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData,
        headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)" }
    })
    return await response.text()
}

async function wpFastest(buffer) {
    const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {}
    const blob = new Blob([buffer], { type: mime })
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(8).toString("hex")
    formData.append("fileToUpload", blob, randomBytes + "." + ext)
    
    const response = await fetch("https://img-tr.wpfc.ml/yukle.php", {
        method: "POST",
        body: formData,
        headers: {
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            "Origin": "https://www.wpfastestcache.com",
            "Referer": "https://www.wpfastestcache.com/es/subir-imagen/"
        }
    })
    const json = await response.json()
    if (!json.success) throw new Error("WPFastest Failed")
    return json.url
}

async function neveloopp(buffer) {
    const { ext, mime } = (await fileTypeFromBuffer(buffer)) || {}
    const blob = new Blob([buffer], { type: mime })
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(8).toString("hex")
    formData.append("file", blob, randomBytes + "." + ext)

    const response = await fetch("https://cdn-neveloopp.ultraplus.click/upload", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
    })
    const json = await response.json()
    if (!json.success) throw new Error("Neveloopp Failed")
    return json.url
}

async function litter(buffer) {
    const { ext } = (await fileTypeFromBuffer(buffer)) || {}
    const tempPath = path.join(os.tmpdir(), `litter_${crypto.randomBytes(4).toString('hex')}.${ext}`)
    fs.writeFileSync(tempPath, buffer)

    try {
        const fileStream = fs.createReadStream(tempPath)
        const form = new FormData()
        form.append("file", new Blob([buffer]), path.basename(tempPath))
        form.append("expireAfter", "24h")
        form.append("burn", "false")

        const token = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
        })

        const response = await axios.post("https://litter.lusia.moe/post/upload", form, {
            params: { token },
            headers: {
                "authority": "litter.lusia.moe",
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36"
            }
        })
        return `https://litter.lusia.moe/${response.data.path}`
    } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    }
}

async function mediaFire(buffer, mimetype) {
    const ext = (await fileTypeFromBuffer(buffer))?.ext || 'bin'
    const tempPath = path.join(os.tmpdir(), `mediafire_${crypto.randomBytes(4).toString('hex')}.${ext}`)
    fs.writeFileSync(tempPath, buffer)

    try {
        const jar = new CookieJar()
        const client = wrapper(axios.create({ jar, withCredentials: true, timeout: 30000, headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" } }))
        
        const res = await client.get("https://www.mediafire.com/upgrade/registration.php?pid=free", { headers: { Accept: "text/html" } })
        const $ = cheerio.load(res.data)
        const security = $('input[name="security"]').val()
        if (!security) throw new Error("SECURITY_TOKEN_NOT_FOUND")

        const email = `${Math.random().toString(36).slice(2)}@baguss.xyz`
        const payload = qs.stringify({ security, reg_first_name: "Antwan", reg_last_name: "Frami", reg_email: email, reg_display: "", reg_pass: "bagusapi2134", agreement: "3.25", pid: "free", signup_continue: "Create Account & Continue" })
        
        const regRes = await client.post("https://www.mediafire.com/dynamic/register_gopro.php", payload, { headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://www.mediafire.com", Referer: "https://www.mediafire.com/upgrade/registration.php?pid=free" } })
        if (regRes.data?.status !== "success" || !regRes.data?.session_token) throw new Error("REGISTER_FAILED")
        
        const sessionToken = regRes.data.session_token
        const filename = path.basename(tempPath)
        const fileData = fs.readFileSync(tempPath)
        
        const form = new FormData()
        form.append("filename", new Blob([fileData]), filename)
        form.append("uploadapi", "yes")
        form.append("response_format", "json")

        const uploadInit = await axios.post("https://www.mediafire.com/api/upload/upload.php?session_token=" + encodeURIComponent(sessionToken), form, { headers: { "User-Agent": "Mozilla/5.0" } })
        
        const raw = typeof uploadInit.data === "string" ? uploadInit.data : JSON.stringify(uploadInit.data)
        const keyMatch = raw.match(/<key>(.*?)</key>/i)
        if (!keyMatch) throw new Error("UPLOAD_KEY_NOT_FOUND")
        const key = keyMatch[1]

        let resultUrl = ''
        while (!resultUrl) {
            const poll = await axios.post("https://www.mediafire.com/api/upload/poll_upload.php?session_token=" + encodeURIComponent(sessionToken), qs.stringify({ key, response_format: "json" }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } })
            const data = poll?.data?.response?.doupload
            if (data?.status === "99") {
                resultUrl = `https://www.mediafire.com/file/${data.quickkey}/${encodeURIComponent(filename)}`
            }
            await new Promise(r => setTimeout(r, 1500))
        }
        return resultUrl
    } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    }
}
