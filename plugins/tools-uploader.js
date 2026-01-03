import { createHash } from 'crypto' 
import fetch from 'node-fetch'
import { FormData, Blob } from "formdata-node"
import { fileTypeFromBuffer } from "file-type"
import crypto from "crypto"
import axios from "axios"
import qs from "qs"
import cheerio from "cheerio"
import fs from "fs"
import { CookieJar } from "tough-cookie"
import { wrapper } from "axios-cookiejar-support"

const toStyled = (text) => {
    const normal = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const styled = "αႦƈԃҽϝɠԋιʝƙʅɱɳσρϙɾʂƚυʋɯxყȥABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return text.split('').map(char => {
        let i = normal.indexOf(char)
        return i !== -1 ? styled[i] : char
    }).join('')
}

const handler = async (m, { conn, command, usedPrefix, args, text }) => {
    try {
        let q = m.quoted ? m.quoted : m
        let mime = (q.msg || q).mimetype || ''
        
        if (!mime) {
            if (args[0]) return conn.reply(m.chat, `❀ Pσɾ ϝαʋσɾ, ɾҽʂρσɳԃҽ α υɳα *Iɱαɠҽɳ* σ *Víԃҽσ* ραɾα ʂυႦιɾ.`, m)
        }

        const services = {
            'catbox': { name: 'Catbox', func: catbox, type: 'all' },
            'mediafire': { name: 'MediaFire', func: mediafire, type: 'all' },
            'wpfc': { name: 'WP Fastest Cache', func: wpFastest, type: 'image' },
            'ultra': { name: 'UltraPlus', func: ultraplus, type: 'all' },
            'litter': { name: 'LitterBox', func: litterbox, type: 'all' }
        }

        const selectedService = args[0] ? args[0].toLowerCase() : null

        if (selectedService && services[selectedService]) {
            if (!mime && m.quoted && m.quoted.quoted) { 
                q = m.quoted.quoted
                mime = (q.msg || q).mimetype || ''
            }
            if (!mime) return conn.reply(m.chat, `❀ Nσ ʂҽ ԋα ҽɳƈσɳƚɾαԃσ ҽʅ αɾƈԋιʋσ. Rҽʂρσɳԃҽ α ʅα ιɱαɠҽɳ ƈσɳ *${usedPrefix + command}*.`, m)

            if (services[selectedService].type === 'image' && !/image/.test(mime)) {
                return conn.reply(m.chat, `❀ Eʂƚҽ ʂҽɾʋιƈισ ʂóʅσ αԃɱιƚҽ *Iɱáɠҽɳҽʂ*.`, m)
            }

            await m.react('🕒')
            const media = await q.download()
            const link = await services[selectedService].func(media)
            const size = formatBytes(media.length)
            const isTele = /image/(png|jpe?g|gif)|video/mp4/.test(mime)
            
            const txt = `•——————•°•✿•°•——————•
╰┈➤ ${toStyled('Uploader')} ⌇°•
⊱┊ Sҽɾʋιƈισ : ${services[selectedService].name}
●～●～●～●～●～●～●～●～

➮ Eɳʅαƈҽ: °❀ *${link}*
➮ Tαɱαñσ: °❀ *${size}*
➮ Exριɾαƈιóɳ: °❀ *${isTele ? 'No expira' : 'Desconocido'}*

ׂ╰┈➤ *${global.wm || 'MαყBσƚ'}*`.trim()

            await conn.sendMessage(m.chat, {
                text: txt,
                buttons: [
                    {
                        buttonId: 'copiar',
                        buttonText: { displayText: '[ 🔗 ] Iɾ αʅ Eɳʅαƈҽ' },
                        type: 1,
                        url: link
                    }
                ],
                contextInfo: {
                    externalAdReply: {
                        title: `SυႦιԃσ α ${services[selectedService].name}`,
                        body: '⊱┊ Uρʅσαԃҽɾ Sҽɾʋιƈҽ ❦',
                        thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/10099/10099236.png',
                        sourceUrl: link,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    },
                    mentionedJid: [m.sender],
                }
            }, { quoted: m })
            
            await m.react('✔️')

        } else {
            let msg = `•——————•°•✿•°•——————•
╰┈➤ ${toStyled('Selecciona un Servicio')} ⌇°•
⊱┊ Rҽʂρσɳԃҽ α υɳ αɾƈԋιʋσ.
●～●～●～●～●～●～●～●～

`
            let rows = []
            for (let [key, val] of Object.entries(services)) {
                rows.push({
                    header: `[ ${toStyled(val.name)} ]`,
                    title: `SυႦιɾ α ${val.name}`,
                    description: `Sσρσɾƚα: ${val.type === 'image' ? 'Sólo Imágenes' : 'Todos los archivos'}`,
                    id: `${usedPrefix + command} ${key}`
                })
            }

            const buttonMessage = {
                text: msg,
                footer: global.wm || 'MαყBσƚ',
                title: " ☁️ *U P L O A D E R* ☁️",
                buttonText: "🔍 Lιʂƚα ԃҽ Sҽɾʋιƈισʂ",
                sections: [
                    {
                        title: "☁️ Sҽɾʋιƈισʂ DιʂρσɳιႦʅҽʂ",
                        rows: rows
                    }
                ]
            }

            await conn.sendMessage(m.chat, buttonMessage, { quoted: m })
        }

    } catch (error) {
        await m.react('✖️')
        console.error(error)
        await conn.reply(m.chat, `⚠︎ Sҽ ԋα ρɾσԃυƈιԃσ υɳ ρɾσႦʅҽɱα.\n> ${error.message}`, m)
    }
}

handler.help = ['tourl', 'upload']
handler.tags = ['tools']
handler.command = ['tourl', 'upload', 'subir']

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

async function wpFastest(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || {}
    if (!/image/.test(mime)) throw new Error("WP Fastest Cache solo soporta imágenes.")
    const blob = new Blob([content], { type: mime })
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(8).toString("hex")
    formData.append("fileToUpload", blob, randomBytes + "." + ext)
    const response = await fetch("https://img-tr.wpfc.ml/yukle.php", {
        method: "POST",
        body: formData,
        headers: {
            "Accept": "/",
            "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            "Referer": "https://www.wpfastestcache.com/es/subir-imagen/",
            "Origin": "https://www.wpfastestcache.com"
        }
    })
    const json = await response.json()
    if (!json.success) throw new Error("Error en WPFC Upload")
    return json.url
}

async function ultraplus(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || {}
    const blob = new Blob([content], { type: mime })
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(8).toString("hex")
    formData.append("file", blob, randomBytes + "." + ext)
    const response = await fetch("https://cdn-neveloopp.ultraplus.click/upload", {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
    })
    const json = await response.json()
    if (!json.success) throw new Error("Error en UltraPlus Upload")
    return json.url
}

async function litterbox(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || {}
    const blob = new Blob([content], { type: mime })
    const formData = new FormData()
    formData.append("file", blob, `file.${ext}`);
    formData.append("expireAfter", "99999999999999");
    formData.append("burn", "false");

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
                "authority": "litter.lusia.moe",
                "accept": "application/json, text/plain, /",
                "origin": "https://litter.lusia.moe",
                "referer": "https://litter.lusia.moe/",
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
            },
        }
    );
    return `https://litter.lusia.moe/${response.data.path}`;
}

async function mediafire(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || {}
    const filename = `file_${crypto.randomBytes(4).toString('hex')}.${ext}`
    
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true, timeout: 30000, headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" } }));

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const genEmail = () => `${Math.random().toString(36).slice(2)}@baguss.xyz`;
    
    const res = await client.get("https://www.mediafire.com/upgrade/registration.php?pid=free", { headers: { Accept: "text/html" } });
    const $ = cheerio.load(res.data);
    const security = $('input[name="security"]').val();
    if (!security) throw new Error("SECURITY_TOKEN_NOT_FOUND");

    const email = genEmail();
    const payload = qs.stringify({ security, reg_first_name: "Antwan", reg_last_name: "Frami", reg_email: email, reg_display: "", reg_pass: "bagusapi2134", agreement: "3.25", pid: "free", signup_continue: "Create Account & Continue" });
    
    const regRes = await client.post("https://www.mediafire.com/dynamic/register_gopro.php", payload, { headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://www.mediafire.com", Referer: "https://www.mediafire.com/upgrade/registration.php?pid=free" } });
    if (regRes.data?.status !== "success" || !regRes.data?.session_token) throw new Error("REGISTER_FAILED");
    const sessionToken = regRes.data.session_token;

    const form = new FormData();
    const blob = new Blob([content], { type: mime })
    form.append("filename", blob, filename);
    form.append("uploadapi", "yes");
    form.append("response_format", "json");

    const uploadInit = await fetch("https://www.mediafire.com/api/upload/upload.php?session_token=" + encodeURIComponent(sessionToken), {
        method: 'POST',
        body: form,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" }
    });
    const initData = await uploadInit.json();
    const key = initData.response?.doupload?.key;
    if (!key) throw new Error("UPLOAD_KEY_NOT_FOUND");

    while (true) {
        const poll = await axios.post("https://www.mediafire.com/api/upload/poll_upload.php?session_token=" + encodeURIComponent(sessionToken), qs.stringify({ key, response_format: "json" }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        const data = poll?.data?.response?.doupload;
        if (data?.status === "99") {
            return `https://www.mediafire.com/file/${data.quickkey}/${encodeURIComponent(filename)}`
        }
        await sleep(1500);
    }
}
