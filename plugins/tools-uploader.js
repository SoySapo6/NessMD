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
        if (!mime) return conn.reply(m.chat, '╰┈➤ ❀ Pσɾ ϝαʋσɾ, ɾҽʂρσɳԃҽ α υɳα *Iɱαɠҽɳ* σ *Vίԃҽσ* σ *Aɾƈԋιʋσ*.', m)

        const services = ['catbox', 'wpfc', 'neveloopp', 'litter', 'mediafire']
        const selectedService = text ? text.toLowerCase().trim() : null

        const toStyled = (text) => {
            const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            const styled = "αႦƈԃҽϝɠԋιʝƙʅɱɳσρϙɾʂƚυʋɯxყȥAƁCƊEƑGHIJKLMNOPQRSTUVWXYZ"
            return text.split('').map(char => {
                let i = normal.indexOf(char)
                return i !== -1 ? styled[i] : char
            }).join('')
        }

        if (!selectedService || !services.includes(selectedService)) {
            let menuText = `•——————•°•✿•°•——————•
╰┈➤ Sҽɾʋιƈισʂ ԃҽ SυႦιԃα ☁
⊱┊ Eʅιɠҽ υɳ ʂҽɾʋιƈισ ɾҽʂρσɳԃιҽɳԃσ
⊱┊ ƈσɳ: *${usedPrefix + command} <nombre>*
●～●～●～●～●～●～●～●～

`
            services.forEach(svc => {
                menuText += `ೃ‧₊› ${toStyled(svc.toUpperCase())}\n`
            })
            
            menuText += `\n↶*ೃ✧˚. ❃ ↷ ˊ-`
            
            return conn.reply(m.chat, menuText, m)
        }

        await m.react('🕒')
        const media = await q.download()
        let link = ''
        let serviceName = ''

        switch (selectedService) {
            case 'catbox':
                link = await catbox(media)
                serviceName = 'CαƚႦσx'
                break
            case 'wpfc':
                link = await wpfastestcache(media)
                serviceName = 'WρFαʂƚҽʂƚCαƈԋҽ'
                break
            case 'neveloopp':
                link = await neveloopp(media)
                serviceName = 'Nҽʋҽʅσσρρ'
                break
            case 'litter':
                link = await litter(media)
                serviceName = 'Lιƚƚҽɾ'
                break
            case 'mediafire':
                link = await mediafireUploader(media)
                serviceName = 'Mҽԃιαϝιɾҽ'
                break
        }

        if (!link) throw new Error('Error al obtener el enlace')

        const size = formatBytes(media.length)
        const txt = `•——————•°•✿•°•——————•
╰┈➤ SυႦιԃα Exιƚσʂα
⊱┊ Sҽɾʋιƈισ: ${serviceName}
⊱┊ Tαɱαñσ: ${size}
●～●～●～●～●～●～●～●～`

        await conn.sendMessage(m.chat, {
            text: txt,
            buttons: [
                {
                    buttonId: 'url',
                    buttonText: { displayText: `[ 🔗 ] Vҽɾ Eɳ ${serviceName}` },
                    type: 1,
                    url: link
                }
            ],
            contextInfo: {
                externalAdReply: {
                    title: `Aɾƈԋιʋσ SυႦιԃσ A ${serviceName}`,
                    body: 'Cʅιƈƙ ραɾα ʋҽɾ',
                    thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/10574/10574768.png',
                    sourceUrl: link,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

        await m.react('✔️')

    } catch (error) {
        console.error(error)
        await m.react('✖️')
        await conn.reply(m.chat, `⚠︎ Sҽ ԋα ρɾσԃυƈιԃσ υɳ ρɾσႦʅҽɱα.\n> Iɳƚҽɳƚα ƈσɳ σƚɾσ ʂҽɾʋιƈισ.`, m)
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
    const { ext, mime } = (await fileTypeFromBuffer(content)) || { ext: 'bin', mime: 'application/octet-stream' }
    const blob = new Blob([content], { type: mime })
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(5).toString("hex")
    formData.append("reqtype", "fileupload")
    formData.append("fileToUpload", blob, randomBytes + "." + ext)
    const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData,
        headers: { "User-Agent": "Mozilla/5.0" }
    })
    return await response.text()
}

async function wpfastestcache(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || { ext: 'jpg', mime: 'image/jpeg' }
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(8).toString("hex")
    const blob = new Blob([content], { type: mime })
    formData.append("fileToUpload", blob, `${randomBytes}.${ext}`)
    
    const response = await fetch("https://img-tr.wpfc.ml/yukle.php", {
        method: "POST",
        body: formData,
        headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
            "Referer": "https://www.wpfastestcache.com/es/subir-imagen/",
            "Origin": "https://www.wpfastestcache.com"
        }
    })
    const json = await response.json()
    return json.url
}

async function neveloopp(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || { ext: 'bin', mime: 'application/octet-stream' }
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(8).toString("hex")
    const blob = new Blob([content], { type: mime })
    formData.append("file", blob, `${randomBytes}.${ext}`)

    const response = await fetch("https://cdn-neveloopp.ultraplus.click/upload", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
    })
    const json = await response.json()
    return json.url
}

async function litter(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || { ext: 'bin', mime: 'application/octet-stream' }
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(8).toString("hex")
    const blob = new Blob([content], { type: mime })
    
    formData.append("file", blob, `${randomBytes}.${ext}`)
    formData.append("expireAfter", "99999999999999")
    formData.append("burn", "false")

    const token = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    })

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
    
    const json = await response.json()
    return `https://litter.lusia.moe/${json.path}`
}

async function mediafireUploader(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || { ext: 'bin', mime: 'application/octet-stream' }
    const jar = new CookieJar()
    const client = wrapper(axios.create({ jar, withCredentials: true, timeout: 30000 }))
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    
    const sleep = ms => new Promise(r => setTimeout(r, ms))
    const rand = (n = 6) => Math.random().toString(36).slice(2, 2 + n)
    const genEmail = () => `${rand()}@baguss.xyz`

    const res = await client.get("https://www.mediafire.com/upgrade/registration.php?pid=free", { headers: { Accept: "text/html", "User-Agent": UA } })
    const $ = cheerio.load(res.data)
    const security = $('input[name="security"]').val()
    
    const email = genEmail()
    const password = "password123"
    
    const regPayload = qs.stringify({
        security,
        reg_first_name: "User",
        reg_last_name: "Temp",
        reg_email: email,
        reg_display: "",
        reg_pass: password,
        agreement: "3.25",
        pid: "free",
        signup_continue: "Create Account & Continue"
    })

    const regRes = await client.post("https://www.mediafire.com/dynamic/register_gopro.php", regPayload, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Origin: "https://www.mediafire.com",
            Referer: "https://www.mediafire.com/upgrade/registration.php?pid=free",
            "User-Agent": UA
        }
    })

    if (regRes.data?.status !== "success" || !regRes.data?.session_token) throw new Error("Mediafire Registration Failed")
    const sessionToken = regRes.data.session_token

    const randomName = `${rand(5)}_${rand(5)}.${ext}`
    const form = new FormData()
    const blob = new Blob([content], { type: mime })
    form.append("filename", blob, randomName)
    form.append("uploadapi", "yes")
    form.append("response_format", "json")

    const init = await fetch(`https://www.mediafire.com/api/upload/upload.php?session_token=${encodeURIComponent(sessionToken)}`, {
        method: "POST",
        body: form,
        headers: { "User-Agent": UA }
    })
    
    const initData = await init.json()
    const key = initData?.response?.doupload?.key

    if (!key) throw new Error("Mediafire Key Missing")

    while (true) {
        const poll = await axios.post(
            `https://www.mediafire.com/api/upload/poll_upload.php?session_token=${encodeURIComponent(sessionToken)}`,
            qs.stringify({ key, response_format: "json" }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA } }
        )

        const data = poll?.data?.response?.doupload
        if (data?.status === "99") {
            const quickkey = data.quickkey || key
            return `https://www.mediafire.com/file/${quickkey}/${randomName}`
        }
        await sleep(1500)
    }
}
