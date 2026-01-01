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
let drm1 = ""
let drm2 = ""

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 5003
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
        username: 'admin',
        password: bcrypt.hashSync('admin123', 10),
        role: 'owner',
        status: 'active',
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

const subbotLogs = new Map()
const subbotStats = new Map()
const MAX_LOGS = 100

const addLog = (phoneNumber, message) => {
    if (!subbotLogs.has(phoneNumber)) subbotLogs.set(phoneNumber, [])
    const logs = subbotLogs.get(phoneNumber)
    logs.push(`[${new Date().toLocaleTimeString()}] ${message}`)
    if (logs.length > MAX_LOGS) logs.shift()
}

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
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
            browser: ['MayBot-Web', 'Chrome', '1.0.0'],
            version: version,
            msgRetryCache
        }

        let sock = makeWASocket(connectionOptions)
        sock.isInit = false
        sock.localConfig = localConfig

        async function connectionUpdate(update) {
            const { connection, lastDisconnect, qr } = update
            
            if (qr && codeResolver && !sock.authState.creds.me) {
                try {
                    let secret = await sock.requestPairingCode(id)
                    codeResolver(secret.match(/.{1,4}/g)?.join("-"))
                } catch (e) { codeRejector(e) }
            }

            if (connection === 'open') {
                sock.isInit = true
                global.conns.push(sock)
                subbotStats.set(id, { messagesSent: 0, connectedAt: new Date() })
                addLog(id, "Conectado exitosamente.")
                if (codeResolver) codeResolver(null)
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode
                addLog(id, `Desconectado: ${reason}`)
                if (reason !== DisconnectReason.loggedOut) {
                    setTimeout(() => startSubBot(id, ownerUsername), 5000)
                } else {
                    deleteSubbotOwner(id)
                    if (fs.existsSync(pathYukiJadiBot)) fs.rmSync(pathYukiJadiBot, { recursive: true })
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
            const handler = await import('../handler.js')
            handler.handler.call(sock, m)
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

app.get('/login', (req, res) => res.render('login', { error: null }))
app.post('/login', (req, res) => {
    const { username, password } = req.body
    const user = getUsers().find(u => u.username === username)
    if (user && bcrypt.compareSync(password, user.password) && user.status === 'active') {
        res.cookie('user', username, { signed: true, httpOnly: true })
        res.redirect('/dashboard')
    } else res.render('login', { error: 'Credenciales inválidas o cuenta suspendida' })
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
    res.json(getUsers().map(u => ({ username: u.username, role: u.role, status: u.status })))
})

app.post('/api/admin/users', checkAuth, checkRole(['owner']), (req, res) => {
    const { username, password, role, permissions } = req.body
    const users = getUsers()
    if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Usuario existe' })
    
    users.push({
        username,
        password: bcrypt.hashSync(password, 10),
        role: role || 'user',
        status: 'active',
        permissions: permissions || []
    })
    saveUsers(users)
    res.json({ success: true })
})

app.post('/api/admin/users/update', checkAuth, checkRole(['owner']), (req, res) => {
    const { username, status, role, password } = req.body
    const users = getUsers()
    const idx = users.findIndex(u => u.username === username)
    if (idx === -1) return res.status(404).json({ error: 'No encontrado' })

    if (status) users[idx].status = status
    if (role) users[idx].role = role
    if (password) users[idx].password = bcrypt.hashSync(password, 10)

    saveUsers(users)
    res.json({ success: true })
})

app.post('/request-code', checkAuth, async (req, res) => {
    const { phoneNumber } = req.body
    if (!phoneNumber) return res.json({ error: "Número requerido" })
    try {
        const code = await startSubBot(phoneNumber, req.user.username)
        res.json({ success: true, code })
    } catch (e) { res.json({ success: false, error: e.message }) }
})

app.listen(PORT, () => console.log(chalk.green(`MayBot Web Interface: http://localhost:${PORT}`)))

export default {
    tags: ['main'],
    command: ['web'],
    help: ['web'],
    handler: (m) => {
        m.reply(`Panel MayBot activo en el puerto ${PORT}`)
    }
}
