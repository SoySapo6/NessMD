import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

let handler = async (m, { conn }) => {
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
  let totalCommands = Object.values(global.plugins).filter(v => v.help && v.tags).length

  let menuText = `•——————•°•✿•°•——————•
ೃ‧₊› MαყBσƚ ⌇°•
⊱┊ ᴴᵉᶜʰᵒ ᵖᵒʳ ${global.etiqueta}
●～●～●～●～●～●～●～●～

➮ 𝐇𝐨𝐫𝐚: °❀ *${hora}*
➮ 𝐅𝐞𝐜𝐡𝐚: °❀ *${fecha}*
➮ 𝐓𝐢𝐩𝐨: °❀ *${conn.user.jid == global.conn.user.jid ? 'Principal' : 'Sub-Bot'}*
➮ 𝐔𝐬𝐮𝐚𝐫𝐢𝐨𝐬: °❀ *${totalreg.toLocaleString()}*
ׂ╰┈➤ *${totalCommands}* ℂ𝕠𝕞𝕒𝕟𝕕𝕠𝕤 𝕕𝕚𝕤𝕡𝕠𝕟𝕚𝕓𝕝𝕖𝕤.`

  for (let [tag, cmds] of Object.entries(categories)) {
    menuText += `
${toStyled(tag)}：
${cmds.map(cmd => `╰┈➤ ${cmd}`).join('\n')}
`
  }

  const content = generateWAMessageFromContent(
    m.chat,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: menuText },
            footer: { text: `ᴴᵉᶜʰᵒ ᵖᵒʳ ${global.etiqueta}` },
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
                serverMessageId: -1
              }
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: 'cta_url',
                  buttonParamsJson: JSON.stringify({
                    display_text: '[ ✾ ] GitHub',
                    url: 'https://github.com/SoySapo6'
                  })
                },
                {
                  name: 'cta_url',
                  buttonParamsJson: JSON.stringify({
                    display_text: '[ ✮ ] Canal WhatsApp',
                    url: 'https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R'
                  })
                }
              ]
            }
          }
        }
      }
    },
    { quoted: m }
  )

  await conn.relayMessage(m.chat, content.message, { messageId: content.key.id })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'menú', 'help', 'ayuda']
handler.register = true

export default handler
