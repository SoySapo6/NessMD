let handler = async (m, { conn, args }) => {
    let userId = m.mentionedJid?.[0] || m.sender
    let categories = {}
    
    for (let plugin of Object.values(global.plugins)) {
        if (!plugin.help || !plugin.tags) continue
        for (let tag of plugin.tags) {
            if (!categories[tag]) categories[tag] = []
            categories[tag].push(...plugin.help.map(cmd => `#${cmd}`))
        }
    }

    const toStyled = (text) => {
        const normal = "abcdefghijklmnopqrstuvwxyz"
        const styled = "αႦƈԃҽϝɠԋιʝƙʅɱɳσρϙɾʂƚυʋɯxყȥ"
        return text.toLowerCase().split('').map(char => {
            let i = normal.indexOf(char)
            return i !== -1 ? styled[i] : char
        }).join('')
    }

    let totalreg = Object.keys(global.db.data.users).length
    let totalCommands = Object.values(global.plugins).filter((v) => v.help && v.tags).length
    
    let menuText = `•——————•°•✿•°•——————•
╰┈➤ MαყBσƚ ⌇°•
⊱┊ ᴴᵉᶜʰᵒ ᵖᵒʳ ${global.etiqueta}
●～●～●～●～●～●～●～●～

➮ 𝐇𝐨𝐫𝐚: °❀ *${hora}*
➮ 𝐅𝐞𝐜𝐡𝐚: °❀ *${fecha}*
➮ 𝐓𝐢𝐩𝐨: °❀ *${(conn.user.jid == global.conn.user.jid ? 'Principal' : 'Sub-Bot')}*
➮ 𝐔𝐬𝐮𝐚𝐫𝐢𝐨𝐬: °❀ *${totalreg.toLocaleString()}*
ׂ╰┈➤ *${totalCommands}* ℂ𝕠𝕞𝕒𝕟𝕕𝕠𝕤 𝕕𝕚𝕤𝕡𝕠𝕟𝕚𝕓𝕝𝕖𝕤.\n\n`.trim()

    for (let [tag, cmds] of Object.entries(categories)) {
        let tagName = toStyled(tag)
        menuText += `
ೃ‧₊› ${tagName} ：
${cmds.map(cmd => `╰┈➤ ${cmd}`).join('\n')}

↶*ೃ✧˚. ❃ ↷ ˊ-↶*ೃ✧˚. ❃ ↷ ˊ-
`
    }

    await conn.sendMessage(m.chat, {
        text: menuText,
        buttons: [
            {
                buttonId: 'github',
                buttonText: { displayText: '[ ✾ ] GιƚHυႦ' },
                type: 1,
                url: 'https://github.com/SoySapo6'
            },
            {
                buttonId: 'canal',
                buttonText: { displayText: '[ ✮ ] Cαɳαʅ ԃҽ WԋαƚʂAρρ' },
                type: 1,
                url: 'https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R'
            }
        ],
        contextInfo: {
            externalAdReply: {
                title: global.canalNombreM[0],
                body: '⊱┊ MαყBσƚ ᵇʸ ˢᵒʸᵐᵃʸᶜᵒˡ ❦',
                thumbnailUrl: 'https://i.postimg.cc/SQTP9YCm/4-sin-titulo-20251120074041.jpg',
                sourceUrl: 'https://mayapi.ooguy.com',
                mediaType: 1,
                renderLargerThumbnail: true
            },
            mentionedJid: [m.sender, userId],
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: global.canalIdM[0],
                newsletterName: global.canalNombreM[0],
                serverMessageId: -1,
            }
        }
    }, { quoted: m })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'menú', 'help', 'ayuda']
handler.register = true

export default handler
