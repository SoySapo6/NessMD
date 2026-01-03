import { createHash } from 'crypto'
import fetch from 'node-fetch'
import axios from 'axios'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'
import crypto from 'crypto'
import * as cheerio from 'cheerio'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'
import { FormData as FormDataNode, Blob } from 'formdata-node'

const handler = async (m, { conn, command, usedPrefix, args, text }) => {
    try {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        
        if (!mime) {
            await m.react('✖️')
            return conn.reply(m.chat, '╰┈➤ ❀ Pσɾ ϝαʋσɾ, ɾҽʂρσɳԃҽ α υɳ *Aɾƈԋιʋσ*, *Iɱαɠҽɳ* σ *Vιԃҽσ*.', m)
        }

        await m.react('🕒')
        const media = await q.download()
        const fileSize = formatBytes(media.length)
        const fileTypeInfo = await fileTypeFromBuffer(media) || { ext: 'bin', mime: mime }
        const fileName = `file_${crypto.randomBytes(4).toString('hex')}.${fileTypeInfo.ext}`

        if (!text && !args[0]) {
            const menuText = `•——————•°•✿•°•——————•
╰┈➤ Sҽʅҽƈƈισɳҽ Sҽɾʋιƈισ ⌇°•
⊱┊ Aɾƈԋιʋσ: ${fileTypeInfo.ext.toUpperCase()}
⊱┊ Pҽʂσ: ${fileSize}
●～●～●～●～●～●～●～●～

➮ Uʂα ʅσʂ Ⴆσƚσɳҽʂ ραɾα ҽʅҽɠιɾ ԃσɳԃҽ ʂυႦιɾ ƚυ αɾƈԋιʋσ.
➮ Sι ϝαʅʅα υɳσ, ιɳƚҽɳƚα ƈσɳ σƚɾσ.

↶*ೃ✧˚. ❃ ↷ ˊ-↶*ೃ✧˚. ❃ ↷ ˊ-`.trim()

            const buttons = [
                { buttonId: `${usedPrefix + command} catbox`, buttonText: { displayText: '╰┈➤ 🐱 CαƚႦσx' }, type: 1 },
                { buttonId: `${usedPrefix + command} mediafire`, buttonText: { displayText: '╰┈➤ 📁 Mҽԃιαϝιɾҽ' }, type: 1 },
                { buttonId: `${usedPrefix + command} litter`, buttonText: { displayText: '╰┈➤ 🚮 Lιƚƚҽɾ' }, type: 1 },
                { buttonId: `${usedPrefix + command} ultra`, buttonText: { displayText: '╰┈➤ ☁️ UʅƚɾαPʅυʂ' }, type: 1 },
            ]

            if (/image/.test(mime)) {
                buttons.push({ buttonId: `${usedPrefix + command} wpfc`, buttonText: { displayText: '╰┈➤ ⚡ WρFαʂƚ' }, type: 1 })
            }

            await conn.sendMessage(m.chat, {
                text: menuText,
                buttons: buttons,
                footer: '⊱┊ MαყBσƚ Uρʅσαԃҽɾ ❦',
                headerType: 1
            }, { quoted: m })
            
            await m.react('✔️')
            return
        }

        let link = ''
        let serviceName = ''
        const type = text.toLowerCase()

        if (type.includes('catbox')) {
            serviceName = 'CαƚႦσx'
            link = await catbox(media)
        } else if (type.includes('mediafire')) {
            serviceName = 'Mҽԃιαϝιɾҽ'
            link = await mediafireUpload(media, fileName)
        } else if (type.includes('litter')) {
            serviceName = 'Lιƚƚҽɾ'
            link = await litterUpload(media, fileName)
        } else if (type.includes('ultra')) {
            serviceName = 'UʅƚɾαPʅυʂ'
            link = await ultraUpload(media, fileName)
        } else if (type.includes('wpfc')) {
            if (!/image/.test(mime)) throw new Error('Este servicio solo admite imágenes.')
            serviceName = 'WρFαʂƚ'
            link = await wpfastestUpload(media, fileName)
        } else {
             serviceName = 'Aυƚσ (CαƚႦσx)'
             link = await catbox(media)
        }

        if (!link) throw new Error('No se obtuvo respuesta del servidor.')

        const txt = `•——————•°•✿•°•——————•
╰┈➤ Rҽʂυʅƚαԃσ ⌇°•
⊱┊ Sҽɾʋιƈισ: ${serviceName}
●～●～●～●～●～●～●～●～

➮ Eɳʅαƈҽ: °❀ *${link}*
➮ Tαɱαñσ: °❀ *${fileSize}*
➮ Exριɾα: °❀ *Dҽʂƈσɳσƈιԃσ*

↶*ೃ✧˚. ❃ ↷ ˊ-`.trim()

        await conn.sendMessage(m.chat, {
            text: txt,
            contextInfo: {
                externalAdReply: {
                    title: `Aɾƈԋιʋσ SυႦιԃσ Exιƚσʂαɱҽɳƚҽ`,
                    body: '⊱┊ MαყBσƚ Uρʅσαԃҽɾ ❦',
                    thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/10099/10099233.png',
                    sourceUrl: link,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            },
            buttons: [
                {
                    buttonId: 'url',
                    buttonText: { displayText: '╰┈➤ 🔗 Iɾ αʅ Eɳʅαƈҽ' },
                    type: 1,
                    url: link
                }
            ]
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        console.error(error)
        await m.react('✖️')
        await conn.reply(m.chat, `⚠︎ Sҽ ԋα ρɾσԃυƈιԃσ υɳ ρɾσႦʅҽɱα.\n> ${error.message}`, m)
    }
}

handler.help = ['tourl', 'catbox', 'mediafire']
handler.tags = ['tools']
handler.command = ['tourl', 'catbox', 'mediafire', 'upload']

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
    const formData = new FormDataNode()
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

async function wpfastestUpload(buffer, filename) {
    const formData = new FormData()
    formData.append("fileToUpload", buffer, { filename: filename, contentType: 'image/jpeg' })
    
    const response = await axios.post("https://img-tr.wpfc.ml/yukle.php", formData, {
        headers: {
            ...formData.getHeaders(),
            "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            "Referer": "https://www.wpfastestcache.com/es/subir-imagen/",
            "Origin": "https://www.wpfastestcache.com"
        }
    })
    
    if (response.data && response.data.success) {
        return response.data.url
    } else {
        throw new Error('Falló la subida a WpFastest')
    }
}

async function ultraUpload(buffer, filename) {
    const formData = new FormData()
    formData.append("file", buffer, filename)
    
    const response = await axios.post("https://cdn-neveloopp.ultraplus.click/upload", formData, {
        headers: {
            ...formData.getHeaders(),
            "Accept": "application/json"
        }
    })
    
    if (response.data && response.data.url) {
        return response.data.url
    } else {
        throw new Error('Falló la subida a UltraPlus')
    }
}

async function litterUpload(buffer, filename) {
    const formData = new FormData()
    formData.append("file", buffer, filename)
    formData.append("expireAfter", "24") 
    formData.append("burn", "false")

    const token = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });

    const response = await axios.post(
        "https://litter.lusia.moe/post/upload",
        formData,
        {
            params: { token },
            headers: {
                ...formData.getHeaders(),
                "authority": "litter.lusia.moe",
                "origin": "https://litter.lusia.moe",
                "referer": "https://litter.lusia.moe/",
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
            },
        }
    )
    
    return `https://litter.lusia.moe/${response.data.path}`
}

async function mediafireUpload(buffer, filename) {
    const jar = new CookieJar()
    const client = wrapper(axios.create({ jar, withCredentials: true, timeout: 30000 }))
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    
    const getSecurity = async () => {
        const res = await client.get("https://www.mediafire.com/upgrade/registration.php?pid=free", { headers: { "User-Agent": UA } })
        const $ = cheerio.load(res.data)
        return $('input[name="security"]').val()
    }

    const registerAccount = async (security) => {
        const email = `${Math.random().toString(36).slice(2)}@baguss.xyz`
        const payload = new URLSearchParams({
            security,
            reg_first_name: "User",
            reg_last_name: "Test",
            reg_email: email,
            reg_pass: "password123",
            agreement: "3.25",
            pid: "free",
            signup_continue: "Create Account & Continue"
        }).toString()

        const res = await client.post("https://www.mediafire.com/dynamic/register_gopro.php", payload, {
            headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA, "Referer": "https://www.mediafire.com/upgrade/registration.php?pid=free" }
        })
        return res.data.session_token
    }

    const security = await getSecurity()
    if (!security) throw new Error('Mediafire: No token security')
    const sessionToken = await registerAccount(security)
    if (!sessionToken) throw new Error('Mediafire: Registro fallido')

    const formData = new FormData()
    formData.append("filename", buffer, filename)
    formData.append("uploadapi", "yes")
    formData.append("response_format", "json")

    const uploadInit = await axios.post(
        `https://www.mediafire.com/api/upload/upload.php?session_token=${sessionToken}`,
        formData,
        { headers: { ...formData.getHeaders(), "User-Agent": UA } }
    )

    const keyMatch = (uploadInit.data.toString() || JSON.stringify(uploadInit.data)).match(/<key>(.*?)<\/key>/i)
    if (!keyMatch) throw new Error('Mediafire: Key no encontrada')
    const key = keyMatch[1]

    let resultUrl = null
    while (!resultUrl) {
        await new Promise(r => setTimeout(r, 2000))
        const poll = await axios.post(
            `https://www.mediafire.com/api/upload/poll_upload.php?session_token=${sessionToken}`,
            new URLSearchParams({ key, response_format: "json" }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA } }
        )
        
        if (poll.data?.response?.doupload?.status === "99") {
            resultUrl = poll.data.response.doupload.file_url || `https://www.mediafire.com/file/${poll.data.response.doupload.quickkey}/${filename}`
        }
    }
    return resultUrl
}
