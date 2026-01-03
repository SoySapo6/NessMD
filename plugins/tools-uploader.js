import { createHash } from 'crypto' 
import fetch from 'node-fetch'
import axios from 'axios'
import { FormData, Blob } from 'formdata-node'
import { fileTypeFromBuffer } from 'file-type'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import cheerio from 'cheerio'
import qs from 'qs'

const handler = async (m, { conn, command, usedPrefix, text, args }) => {
    try {
        const q = m.quoted ? m.quoted : m
        const mime = (q.msg || q).mimetype || ''
        if (!mime) return conn.reply(m.chat, '╰┈➤ ❀ Pσɾ ϝαʋσɾ, ɾҽʂρσɳԃҽ α υɳ *Aɾƈԋιʋσ*, *Iɱαɠҽɳ* σ *Víԃҽσ*.', m)

        await m.react('🕒')
        const media = await q.download()
        const isImageOrVideo = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime)
        const fileSize = formatBytes(media.length)
        const ext = await fileTypeFromBuffer(media).then(f => f ? f.ext : 'bin')
        const fileName = `${Date.now()}.${ext}`
        
        let link = ''
        let serviceName = ''

        const toStyled = (str) => {
            const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
            const styled = "αႦƈԃҽϝɠԋιʝƙʅɱɳσρϙɾʂƚυʋɯxყȥAƁCƊEFGHIJKLMNOPQRSTUVWXYZ"
            return str.split('').map(char => {
                let i = normal.indexOf(char)
                return i !== -1 ? styled[i] : char
            }).join('')
        }

        if (command === 'tourl' && !text) {
             const menuText = `
•——————•°•✿•°•——————•
╰┈➤ Sҽɾʋιƈισʂ ԃҽ SυႦιԃα ⌇°•
⊱┊ Sҽʅҽƈƈισɳα υɳ ʂҽɾʋιƈισ ҽʂƈɾιႦιҽɳԃσ ҽʅ ɳσɱႦɾҽ:
●～●～●～●～●～●～●～●～

➮ *${usedPrefix}catbox* (Iɱαɠҽɳҽʂ/Víԃҽσʂ/Aɾƈԋιʋσʂ)
➮ *${usedPrefix}mediafire* (Tσԃσ ƚιρσ ԃҽ αɾƈԋιʋσ)
➮ *${usedPrefix}wpfc* (Sσʅσ Iɱαɠҽɳҽʂ)
➮ *${usedPrefix}litter* (Tσԃσ ƚιρσ ԃҽ αɾƈԋιʋσ - Tҽɱρσɾαʅ)
➮ *${usedPrefix}ultra* (Tσԃσ ƚιρσ ԃҽ αɾƈԋιʋσ)

ׂ╰┈➤ Rҽʂρσɳԃҽ ƈσɳ ҽʅ ƈσɱαɳԃσ ԃҽʂҽαԃσ.
`.trim()
            await conn.reply(m.chat, menuText, m)
            await m.react('❔')
            return
        }

        switch (command) {
            case 'wpfc':
            case 'imgtr':
                if (!/image/.test(mime)) return conn.reply(m.chat, '╰┈➤ ⚠︎ Eʂƚҽ ʂҽɾʋιƈισ ʂσʅσ αԃɱιƚҽ *Iɱαɠҽɳҽʂ*.', m)
                link = await uploadWpfc(media, ext)
                serviceName = 'WPFastestCache'
                break

            case 'mediafire':
            case 'mf':
                link = await uploadMediaFire(media, fileName)
                serviceName = 'MediaFire'
                break

            case 'litter':
                link = await uploadLitter(media, fileName)
                serviceName = 'Litter.lusia'
                break

            case 'ultra':
            case 'nevel':
                link = await uploadUltra(media, fileName)
                serviceName = 'UltraPlus'
                break

            case 'tourl':
            case 'catbox':
            default:
                link = await catbox(media)
                serviceName = 'Catbox'
                break
        }

        const txt = `•——————•°•✿•°•——————•
╰┈➤ Rҽʂυʅƚαԃσ ⌇°•
⊱┊ SυႦιԃσ ҽxιƚσʂαɱҽɳƚҽ
●～●～●～●～●～●～●～●～

➮ Sҽɾʋιƈισ: °❀ *${toStyled(serviceName)}*
➮ Tαɱαñσ: °❀ *${fileSize}*
➮ Eɳʅαƈҽ: °❀ *${link}*

ׂ╰┈➤ Uʂα ҽʅ Ⴆσƚóɳ ραɾα αႦɾιɾ.`.trim()

        await conn.sendMessage(m.chat, {
            text: txt,
            buttons: [
                {
                    buttonId: 'link',
                    buttonText: { displayText: '[ 🔗 ] Iɾ αʅ Eɳʅαƈҽ' },
                    type: 1,
                    url: link
                }
            ],
            contextInfo: {
                externalAdReply: {
                    title: `SυႦιԃα ƈσɱρʅҽƚαԃα: ${serviceName}`,
                    body: '⊱┊ MαყBσƚ ᵇʸ ˢᵒʸᵐᵃʸᶜᵒˡ ❦',
                    thumbnailUrl: link && isImageOrVideo ? link : 'https://img.icons8.com/color/48/upload-to-cloud.png',
                    sourceUrl: link,
                    mediaType: 1,
                    renderLargerThumbnail: true
                },
                mentionedJid: [m.sender],
                isForwarded: true
            }
        }, { quoted: m })

        await m.react('✔️')

    } catch (error) {
        await m.react('✖️')
        console.error(error)
        await conn.reply(m.chat, `╰┈➤ ⚠︎ Eɾɾσɾ: ${error.message}`, m)
    }
}

handler.help = ['tourl', 'catbox', 'mediafire', 'wpfc', 'litter', 'ultra']
handler.tags = ['tools']
handler.command = ['tourl', 'catbox', 'mediafire', 'mf', 'wpfc', 'imgtr', 'litter', 'ultra', 'nevel']

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

async function uploadWpfc(buffer, ext) {
    const formData = new FormData()
    const blob = new Blob([buffer], { type: 'image/' + ext })
    const filename = `${crypto.randomBytes(8).toString('hex')}.${ext}`
    
    formData.append('fileToUpload', blob, filename)

    const response = await fetch("https://img-tr.wpfc.ml/yukle.php", {
        method: 'POST',
        body: formData,
        headers: {
            "Accept": "/",
            "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            "Referer": "https://www.wpfastestcache.com/es/subir-imagen/",
            "Origin": "https://www.wpfastestcache.com",
            "DNT": "1",
            "Upgrade-Insecure-Requests": "1"
        }
    })
    
    const text = await response.text()
    try {
        const json = JSON.parse(text)
        if (json.success) return json.url
        throw new Error('Upload failed in API')
    } catch (e) {
        throw new Error('WPFC response error')
    }
}

async function uploadUltra(buffer, filename) {
    const formData = new FormData()
    const blob = new Blob([buffer])
    formData.append('file', blob, filename)
    
    const response = await fetch("https://cdn-neveloopp.ultraplus.click/upload", {
        method: 'POST',
        body: formData,
        headers: {
            "Accept": "application/json"
        }
    })
    
    const json = await response.json()
    if (json.success) return json.url
    throw new Error('Ultraplus failed')
}

async function uploadLitter(buffer, filename) {
    const tempPath = path.join('./tmp', filename)
    fs.writeFileSync(tempPath, buffer)
    
    try {
        const form = new FormData()
        form.append("file", fs.createReadStream(tempPath))
        form.append("expireAfter", "99999999999999")
        form.append("burn", "false")

        const token = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });

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
                   "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
                },
            }
        );
        return `https://litter.lusia.moe/${response.data.path}`
    } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    }
}

async function uploadMediaFire(buffer, filename) {
    const tempPath = path.join('./tmp', filename)
    fs.writeFileSync(tempPath, buffer)
    
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true, timeout: 30000, headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" } }));

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const rand = (n = 6) => Math.random().toString(36).slice(2, 2 + n);
    const genEmail = () => `${rand()}@baguss.xyz`;

    try {
        const res = await client.get("https://www.mediafire.com/upgrade/registration.php?pid=free", { headers: { Accept: "text/html" } });
        const $ = cheerio.load(res.data);
        const security = $('input[name="security"]').val();
        if (!security) throw new Error("SECURITY_TOKEN_NOT_FOUND");

        const email = genEmail()
        const payload = qs.stringify({
            security,
            reg_first_name: "Antwan",
            reg_last_name: "Frami",
            reg_email: email,
            reg_display: "",
            reg_pass: "bagusapi2134",
            agreement: "3.25",
            pid: "free",
            signup_continue: "Create Account & Continue"
        });

        const regRes = await client.post("https://www.mediafire.com/dynamic/register_gopro.php", payload, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Origin: "https://www.mediafire.com",
                Referer: "https://www.mediafire.com/upgrade/registration.php?pid=free"
            }
        });

        if (regRes.data?.status !== "success" || !regRes.data?.session_token) {
            throw new Error("REGISTER_FAILED");
        }
        const sessionToken = regRes.data.session_token;

        const form = new FormData();
        form.append("filename", fs.createReadStream(tempPath), filename);
        form.append("uploadapi", "yes");
        form.append("response_format", "json");

        const uploadInit = await axios.post("https://www.mediafire.com/api/upload/upload.php?session_token=" + encodeURIComponent(sessionToken), form, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" },
            maxBodyLength: Infinity
        });

        const raw = typeof uploadInit.data === "string" ? uploadInit.data : JSON.stringify(uploadInit.data);
        const keyMatch = raw.match(/<key>(.*?)<\/key>/i);
        if (!keyMatch) throw new Error("UPLOAD_KEY_NOT_FOUND");
        const key = keyMatch[1];

        while (true) {
            const poll = await axios.post("https://www.mediafire.com/api/upload/poll_upload.php?session_token=" + encodeURIComponent(sessionToken), new URLSearchParams({ key, response_format: "json" }).toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
            const data = poll?.data?.response?.doupload;
            if (data?.status === "99") {
                const quickkey = data.quickkey || key;
                return `https://www.mediafire.com/file/${quickkey}/${encodeURIComponent(filename)}`
            }
            await sleep(1500);
        }
    } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    }
}
