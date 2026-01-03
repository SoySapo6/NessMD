import { createHash } from 'crypto'
import fetch from 'node-fetch'
import axios from 'axios'
import { FormData, Blob } from 'formdata-node'
import { fileTypeFromBuffer } from 'file-type'
import crypto from 'crypto'
import cheerio from 'cheerio'
import qs from 'qs'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

const handler = async (m, { conn, command, usedPrefix, args, text }) => {
    try {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        
        if (!mime) {
            return conn.reply(m.chat, `⚠︎ 𝙿𝚘𝚛 𝚏𝚊𝚟𝚘𝚛, 𝚛𝚎𝚜𝚙𝚘𝚗𝚍𝚎 𝚊 𝚞𝚗 𝚊𝚛𝚌𝚑𝚒𝚟𝚘 𝚖𝚞𝚕𝚝𝚒𝚖𝚎𝚍𝚒𝚊.`, m)
        }

        const validServices = ['catbox', 'mediafire', 'wpfc', 'litter', 'nevel']
        const selectedService = args[0]?.toLowerCase()

        if (!selectedService || !validServices.includes(selectedService)) {
            let menuText = `
乂 *S E R V I C I O S - U P L O A D* 乂

➮ 𝚂𝚎𝚕𝚎𝚌𝚌𝚒𝚘𝚗𝚊 𝚞𝚗 𝚜𝚎𝚛𝚟𝚒𝚌𝚒𝚘 𝚛𝚎𝚜𝚙𝚘𝚗𝚍𝚒𝚎𝚗𝚍𝚘 𝚊 𝚝𝚞 𝚊𝚛𝚌𝚑𝚒𝚟𝚘:
➮ 𝙴𝚓𝚎𝚖𝚙𝚕𝚘: *${usedPrefix + command} mediafire*

╭┈➤ 𝙻𝚒𝚜𝚝𝚊 𝚍𝚎 𝚂𝚎𝚛𝚟𝚒𝚌𝚒𝚘𝚜:
│ 
│ ◎ *${usedPrefix + command} catbox*
│    (𝙸𝚖𝚊𝚐𝚎𝚗/𝚅𝚒𝚍𝚎𝚘 - 𝟸𝟶𝟶𝙼𝙱 𝙼𝚊𝚡)
│ 
│ ◎ *${usedPrefix + command} mediafire*
│    (𝚃𝚘𝚍𝚘 𝚃𝚒𝚙𝚘 - 𝚂𝚒𝚗 𝙻𝚒𝚖𝚒𝚝𝚎)
│ 
│ ◎ *${usedPrefix + command} wpfc*
│    (𝙸𝚖𝚊𝚐𝚎𝚗𝚎𝚜 - 𝚄𝚕𝚝𝚛𝚊 𝚁𝚊𝚙𝚒𝚍𝚘)
│ 
│ ◎ *${usedPrefix + command} litter*
│    (𝚃𝚎𝚖𝚙𝚘𝚛𝚊𝚕 - 𝟷𝙶𝙱 𝙼𝚊𝚡)
│ 
│ ◎ *${usedPrefix + command} nevel*
│    (𝚃𝚘𝚍𝚘 𝚃𝚒𝚙𝚘 - 𝙲𝙳𝙽)
│
╰┈➤ 𝚂𝚎𝚕𝚎𝚌𝚌𝚒𝚘𝚗𝚊 𝚜𝚊𝚋𝚒𝚊𝚖𝚎𝚗𝚝𝚎.
`.trim()
            return conn.reply(m.chat, menuText, m)
        }

        await m.react('🕒')
        const media = await q.download()
        const fileType = await fileTypeFromBuffer(media) || { ext: 'bin', mime: mime }
        const filename = `${crypto.randomBytes(4).toString('hex')}.${fileType.ext}`
        
        let link = ''
        let serverName = ''

        switch (selectedService) {
            case 'catbox':
                serverName = '𝙲𝙰𝚃𝙱𝙾𝚇'
                link = await catbox(media)
                break
            case 'mediafire':
                serverName = '𝙼𝙴𝙳𝙸𝙰𝙵𝙸𝚁𝙴'
                link = await mediafireUpload(media, filename)
                break
            case 'wpfc':
                if (!/image/.test(mime)) throw new Error("Este servicio solo acepta imágenes.")
                serverName = '𝚆𝙿𝙵𝙲'
                link = await wpfc(media, filename)
                break
            case 'litter':
                serverName = '𝙻𝙸𝚃𝚃𝙴𝚁'
                link = await litter(media, filename)
                break
            case 'nevel':
                serverName = '𝙽𝙴𝚅𝙴𝙻𝙾𝙾𝙿𝙿'
                link = await neveloopp(media, filename)
                break
        }

        const caption = `
乂 *U P L O A D - S U C C E S S* 乂

➮ *𝚂𝚎𝚛𝚟𝚒𝚍𝚘𝚛:* ${serverName}
➮ *𝚃𝚊𝚖𝚊ñ𝚘:* ${formatBytes(media.length)}
➮ *𝙴𝚡𝚙𝚒𝚛𝚊𝚌𝚒𝚘𝚗:* 𝙳𝚎𝚜𝚌𝚘𝚗𝚘𝚌𝚒𝚍𝚘

↓ *𝙴𝙽𝙻𝙰𝙲𝙴 𝙳𝙸𝚁𝙴𝙲𝚃𝙾* ↓
${link}
`.trim()

        await conn.sendMessage(m.chat, {
            text: caption,
            contextInfo: {
                externalAdReply: {
                    title: `➮ 𝙰𝚛𝚌𝚑𝚒𝚟𝚘 𝚂𝚞𝚋𝚒𝚍𝚘: ${serverName}`,
                    body: '𝙲𝚕𝚒𝚌𝚔 𝚙𝚊𝚛𝚊 𝚟𝚎𝚛',
                    thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/10099/10099233.png',
                    sourceUrl: link,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

        await m.react('✔️')

    } catch (error) {
        await m.react('✖️')
        console.error(error)
        await conn.reply(m.chat, `⚠︎ 𝙴𝚛𝚛𝚘𝚛 𝚊𝚕 𝚜𝚞𝚋𝚒𝚛 𝚎𝚕 𝚊𝚛𝚌𝚑𝚒𝚟𝚘:\n> ${error.message}`, m)
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
    formData.append("reqtype", "fileupload")
    formData.append("fileToUpload", blob, `file.${ext}`)
    const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData,
        headers: { "User-Agent": "Mozilla/5.0" }
    })
    return await response.text()
}

async function wpfc(buffer, filename) {
    const { mime } = await fileTypeFromBuffer(buffer) || {}
    const blob = new Blob([buffer], { type: mime })
    const formData = new FormData()
    formData.append("fileToUpload", blob, filename)

    const response = await fetch("https://img-tr.wpfc.ml/yukle.php", {
        method: "POST",
        body: formData,
        headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            "Referer": "https://www.wpfastestcache.com/es/subir-imagen/",
            "Origin": "https://www.wpfastestcache.com",
            "Accept": "application/json"
        }
    })
    
    const text = await response.text()
    try {
        const json = JSON.parse(text)
        if (json.success) return json.url
        throw new Error("Upload failed WPFC")
    } catch (e) {
        throw new Error("Invalid response from WPFC")
    }
}

async function neveloopp(buffer, filename) {
    const blob = new Blob([buffer])
    const formData = new FormData()
    formData.append("file", blob, filename)

    const response = await fetch("https://cdn-neveloopp.ultraplus.click/upload", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
    })

    const json = await response.json()
    if (json.success) return json.url
    throw new Error("Upload failed Neveloopp")
}

async function litter(buffer, filename) {
    const { mime } = (await fileTypeFromBuffer(buffer)) || { mime: 'application/octet-stream' }
    const blob = new Blob([buffer], { type: mime })
    const formData = new FormData()
    formData.append("file", blob, filename)
    formData.append("expireAfter", "24h")
    formData.append("burn", "false")

    const token = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });

    const response = await fetch("https://litter.lusia.moe/post/upload?token=" + token, {
        method: "POST",
        body: formData,
        headers: {
            "authority": "litter.lusia.moe",
            "origin": "https://litter.lusia.moe",
            "referer": "https://litter.lusia.moe/",
            "user-agent": "Mozilla/5.0"
        }
    })

    if (!response.ok) throw new Error("Litter upload failed")
    const json = await response.json()
    return `https://litter.lusia.moe/${json.path}`
}

async function mediafireUpload(buffer, filename) {
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    const jar = new CookieJar()
    const client = wrapper(axios.create({ jar, withCredentials: true, timeout: 30000, headers: { "User-Agent": UA } }))

    const getSecurity = async () => {
        const res = await client.get("https://www.mediafire.com/upgrade/registration.php?pid=free", { headers: { Accept: "text/html" } })
        const $ = cheerio.load(res.data)
        const security = $('input[name="security"]').val()
        if (!security) throw new Error("SECURITY_TOKEN_NOT_FOUND")
        return security
    }

    const registerAccount = async (security) => {
        const email = `${Math.random().toString(36).slice(2)}@baguss.xyz`
        const payload = qs.stringify({
            security,
            reg_first_name: "User",
            reg_last_name: "Temp",
            reg_email: email,
            reg_pass: "password123",
            agreement: "3.25",
            pid: "free",
            signup_continue: "Create Account & Continue"
        })
        const res = await client.post("https://www.mediafire.com/dynamic/register_gopro.php", payload, {
            headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://www.mediafire.com" }
        })
        if (res.data?.status !== "success" || !res.data?.session_token) throw new Error("REGISTER_FAILED")
        return res.data.session_token
    }

    const security = await getSecurity()
    const sessionToken = await registerAccount(security)

    const form = new FormData()
    form.append("filename", new Blob([buffer]), filename)
    form.append("uploadapi", "yes")
    form.append("response_format", "json")

    const initRes = await fetch(`https://www.mediafire.com/api/upload/upload.php?session_token=${sessionToken}`, {
        method: "POST",
        body: form,
        headers: { "User-Agent": UA }
    })
    const initData = await initRes.json()
    const key = initData?.doupload?.key || initData?.key
    if (!key) throw new Error("UPLOAD_KEY_NOT_FOUND")

    while (true) {
        await new Promise(r => setTimeout(r, 2000))
        const pollRes = await client.post(
            `https://www.mediafire.com/api/upload/poll_upload.php?session_token=${sessionToken}`,
            qs.stringify({ key, response_format: "json" }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        )
        const data = pollRes.data?.response?.doupload
        if (data?.status === "99") {
            return `https://www.mediafire.com/file/${data.quickkey}/${filename}`
        }
    }
}
