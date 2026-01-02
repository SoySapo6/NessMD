import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { fileURLToPath } from 'url'
import { makeWASocket } from '../lib/simple.js'
import { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'
import NodeCache from 'node-cache'
import chalk from 'chalk'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import axios from 'axios'
import FormData from 'form-data'
const { child, spawn, exec } = await import('child_process')
import * as ws from 'ws'
const { CONNECTING } = ws

let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000
const COOKIE_SECRET = 'may-7h5fa8'

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser(COOKIE_SECRET))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '../lib/views'))

const usersFile = path.join(process.cwd(), 'database', 'web_users.json')
const subbotOwnershipFile = path.join(process.cwd(), 'database', 'web_subbots.json')

if (!fs.existsSync(path.dirname(usersFile))) fs.mkdirSync(path.dirname(usersFile), { recursive: true })
if (!fs.existsSync(usersFile)) {
    const initialOwner = {
        username: global.userowner || 'admin',
        password: bcrypt.hashSync(global.passowner || 'admin', 10),
        role: 'owner',
        status: 'active',
        limit: 100,
        permissions: ['all']
    }
    fs.writeFileSync(usersFile, JSON.stringify([initialOwner]))
}
if (!fs.existsSync(subbotOwnershipFile)) fs.writeFileSync(subbotOwnershipFile, JSON.stringify({}))

const getUsers = () => JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
const saveUsers = (users) => fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
const getSubbotOwners = () => JSON.parse(fs.readFileSync(subbotOwnershipFile, 'utf-8'))
const saveSubbotOwner = (phoneNumber, username) => {
    const data = getSubbotOwners()
    data[phoneNumber] = username
    fs.writeFileSync(subbotOwnershipFile, JSON.stringify(data, null, 2))
}
const deleteSubbotOwner = (phoneNumber) => {
    const data = getSubbotOwners()
    delete data[phoneNumber]
    fs.writeFileSync(subbotOwnershipFile, JSON.stringify(data, null, 2))
}

const subbotStats = new Map()

async function uploadToFreeImageHost(buffer) {
  try {
    const form = new FormData()
    form.append('source', buffer, 'file')
    const res = await axios.post('https://freeimage.host/api/1/upload', form, {
      params: { key: '6d207e02198a847aa98d0a2a901485a5' },
      headers: form.getHeaders()
    })
    return res.data.image.url
  } catch (err) {
    return null
  }
}

const upload = multer({ storage: multer.memoryStorage() })

if (!(global.conns instanceof Array)) global.conns = []

const getSessionPath = (id) => path.join(global.jadi || 'Sessions/SubBot', id)

async function startSubBot(phoneNumber, ownerUsername) {
    let id = phoneNumber.replace(/[^0-9]/g, '')
    let pathYukiJadiBot = getSessionPath(id)
    saveSubbotOwner(id, ownerUsername)

    if (!fs.existsSync(pathYukiJadiBot)) fs.mkdirSync(pathYukiJadiBot, { recursive: true })
    
    const configPath = path.join(pathYukiJadiBot, 'config.json')
    let localConfig = { botname: 'MayBot', banner: 'https://files.catbox.moe/aqi8wi.png' }
    if (fs.existsSync(configPath)) localConfig = JSON.parse(fs.readFileSync(configPath))

    const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64")
    let codeResolver, codeRejector
    const codePromise = new Promise((resolve, reject) => { codeResolver = resolve; codeRejector = reject })

    exec(comb.toString("utf-8"), async (err, stdout, stderr) => {
        let { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(pathYukiJadiBot)
        const msgRetryCache = new NodeCache()

        const connectionOptions = {
            logger: pino({ level: "fatal" }),
            printQRInTerminal: false,
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
            browser: ['Windows', 'Firefox'],
            version: version,
            msgRetryCache,
            generateHighQualityLinkPreview: true
        }

        let sock = makeWASocket(connectionOptions)
        sock.isInit = false
        sock.localConfig = localConfig

        setTimeout(async () => {
            if (!sock.user) {
                try { sock.ws?.close() } catch {}
                sock.ev.removeAllListeners()
                let i = global.conns.indexOf(sock)
                if (i >= 0) global.conns.splice(i, 1)
                if (codeRejector) codeRejector(new Error('Tiempo de espera agotado'))
            }
        }, 60000)

        async function connectionUpdate(update) {
            const { connection, lastDisconnect, qr } = update
            
            if (qr && codeResolver && !sock.authState.creds.me) {
                try {
                    let secret = await sock.requestPairingCode(id)
                    codeResolver(secret.match(/.{1,4}/g)?.join("-"))
                    codeResolver = null 
                } catch (e) { 
                    codeRejector(e) 
                }
            }

            if (connection === 'open') {
                sock.isInit = true
                global.conns.push(sock)
                subbotStats.set(id, { messagesSent: 0, connectedAt: new Date() })
                if (codeResolver) codeResolver(null)
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode
                
                if (reason === 428) {
                    startSubBot(id, ownerUsername)
                } else if (reason === 408) {
                    startSubBot(id, ownerUsername)
                } else if (reason === 515) {
                    startSubBot(id, ownerUsername)
                } else if (reason === 440) {
                     deleteSubbotOwner(id)
                     try { fs.rmSync(pathYukiJadiBot, { recursive: true }) } catch {}
                     sock.ev.removeAllListeners()
                } else if (reason === 403 || reason === 401 || reason === 405) {
                     deleteSubbotOwner(id)
                     try { fs.rmSync(pathYukiJadiBot, { recursive: true }) } catch {}
                     sock.ev.removeAllListeners()
                } else if (reason !== DisconnectReason.loggedOut) {
                   
                } else {
                    deleteSubbotOwner(id)
                    try { fs.rmSync(pathYukiJadiBot, { recursive: true }) } catch {}
                    sock.ev.removeAllListeners()
                }
            }
        }

        sock.ev.on('connection.update', connectionUpdate)
        sock.ev.on('creds.update', saveCreds)
        sock.ev.on('messages.upsert', async (m) => {
            if (m.type === 'append' || m.type === 'notify') {
                const stats = subbotStats.get(id) || { messagesSent: 0 }
                stats.messagesSent++
                subbotStats.set(id, stats)
            }
            try {
                const handler = await import('../handler.js')
                handler.handler.call(sock, m)
            } catch (e) {}
        })
    })
    return codePromise
}

const checkAuth = (req, res, next) => {
    if (!req.signedCookies.user) return res.redirect('/login')
    const user = getUsers().find(u => u.username === req.signedCookies.user)
    if (!user || user.status === 'suspended') return res.clearCookie('user').redirect('/login')
    req.user = user
    next()
}

const checkRole = (roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) return next()
    res.status(403).json({ error: 'Acceso denegado' })
}

app.get('/', (req, res) => {
      if (req.signedCookies.user) {
        res.redirect('/dashboard')
    } else {
        res.redirect('/login')
    }
})

app.get('/login', (req, res) => res.render('login', { error: null }))
app.post('/login', (req, res) => {
    const { username, password } = req.body
    const user = getUsers().find(u => u.username === username)
    if (user && bcrypt.compareSync(password, user.password) && user.status === 'active') {
        res.cookie('user', username, { signed: true, httpOnly: true })
        res.redirect('/dashboard')
    } else res.render('login', { error: 'Credenciales inválidas o cuenta suspendida' })
})

app.get('/register', (req, res) => res.render('register', { error: null }))
app.post('/register', (req, res) => {
    const { username, password } = req.body
    const users = getUsers()
    if (users.find(u => u.username === username)) return res.render('register', { error: 'El usuario ya existe' })
    
    users.push({
        username,
        password: bcrypt.hashSync(password, 10),
        role: 'user',
        status: 'active',
        limit: 3,
        permissions: []
    })
    saveUsers(users)
    res.redirect('/login')
})

app.get('/logout', (req, res) => {
    res.clearCookie('user')
    res.redirect('/login')
})

app.get('/dashboard', checkAuth, (req, res) => {
    const totalSubbots = global.conns.length
    res.render('dashboard', { user: req.user, totalSubbots })
})

app.get('/api/system-stats', checkAuth, (req, res) => {
    res.json({
        ram: {
            total: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            free: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            usage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2) + '%'
        },
        cpu: os.cpus()[0].model,
        uptime: os.uptime(),
        platform: os.platform()
    })
})

app.get('/api/my-subbots', checkAuth, (req, res) => {
    const owners = getSubbotOwners()
    const mySubbots = global.conns
        .filter(sock => sock.user)
        .map(sock => {
            const id = sock.user.jid.split('@')[0]
            const stats = subbotStats.get(id) || {}
            return {
                id,
                name: sock.localConfig?.botname || 'MayBot',
                jid: sock.user.jid,
                owner: owners[id],
                stats: stats
            }
        })
        .filter(bot => req.user.role === 'owner' || req.user.role === 'admin' || bot.owner === req.user.username)
    res.json(mySubbots)
})

app.post('/api/subbot/action', checkAuth, async (req, res) => {
    const { id, action } = req.body
    const owners = getSubbotOwners()
    if (req.user.role !== 'owner' && owners[id] !== req.user.username) return res.status(403).json({ error: 'No autorizado' })

    const sockIdx = global.conns.findIndex(s => s.user?.jid.split('@')[0] === id)
    
    if (action === 'stop' || action === 'restart') {
        if (sockIdx > -1) {
            try { global.conns[sockIdx].ws.close() } catch {}
            global.conns.splice(sockIdx, 1)
        }
    }

    if (action === 'start' || action === 'restart') {
        await startSubBot(id, owners[id] || req.user.username)
    }

    if (action === 'delete' && req.user.role === 'owner') {
        const pathBot = getSessionPath(id)
        if (fs.existsSync(pathBot)) fs.rmSync(pathBot, { recursive: true })
        deleteSubbotOwner(id)
    }

    res.json({ success: true })
})

app.post('/api/subbot/config/:id', checkAuth, upload.fields([{ name: 'banner' }, { name: 'icono' }]), async (req, res) => {
    const { id } = req.params
    const owners = getSubbotOwners()
    if (req.user.role !== 'owner' && owners[id] !== req.user.username) return res.status(403).json({ error: 'No autorizado' })

    const configPath = path.join(getSessionPath(id), 'config.json')
    let config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath)) : {}

    if (req.body.botname) config.botname = req.body.botname
    if (req.files['banner']) config.banner = await uploadToFreeImageHost(req.files['banner'][0].buffer)
    if (req.files['icono']) config.icono = await uploadToFreeImageHost(req.files['icono'][0].buffer)
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    const sock = global.conns.find(s => s.user?.jid.split('@')[0] === id)
    if (sock) sock.localConfig = config

    res.json({ success: true, config })
})

app.get('/api/admin/users', checkAuth, checkRole(['owner', 'admin']), (req, res) => {
    res.json(getUsers().map(u => ({ username: u.username, role: u.role, status: u.status, limit: u.limit || 3 })))
})

app.post('/api/admin/users/limit', checkAuth, checkRole(['owner']), (req, res) => {
    const { username, limit } = req.body
    const users = getUsers()
    const idx = users.findIndex(u => u.username === username)
    if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' })
    users[idx].limit = parseInt(limit)
    saveUsers(users)
    res.json({ success: true })
})

app.post('/request-code', checkAuth, async (req, res) => {
    const { phoneNumber } = req.body
    if (!phoneNumber) return res.json({ error: "Número requerido" })
    
    const owners = getSubbotOwners()
    const userBots = Object.values(owners).filter(u => u === req.user.username).length
    const limit = req.user.limit || 3

    if (userBots >= limit && req.user.role !== 'owner') {
        return res.json({ success: false, error: `Has alcanzado tu límite de ${limit} subbots.` })
    }

    try {
        const code = await startSubBot(phoneNumber, req.user.username)
        res.json({ success: true, code })
    } catch (e) { res.json({ success: false, error: e.message }) }
})

app.listen(PORT, () => console.log(chalk.black.bgWhite(`[ MAYBOT ] Servidor Web Iniciado.`)))

export default {
    tags: ['main'],
    command: ['web'],
    help: ['web'],
    handler: (m) => {
        m.reply(`[ MAYBOT ] Panel Web Activo.`)
    }
}
