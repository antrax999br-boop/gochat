import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pino from 'pino';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// --- CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const AUTH_FOLDER = path.join(__dirname, 'auth_info_baileys');

app.use(cors());
app.use(express.json());

// --- MANUAL STATE MANAGEMENT ---
let currentQR = null;
let currentStatus = 'disconnected';
let sock = null;

// Simple in-memory store for chats and messages
const chats = new Map();
const messages = new Map();

// Log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- WHATSAPP SERVICE ---
async function connectToWhatsApp() {
    console.log(`Iniciando serviço WhatsApp (Sessão: ${AUTH_FOLDER})...`);

    // Ensure auth folder exists
    try { await fs.mkdir(AUTH_FOLDER, { recursive: true }); } catch { }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Vitta Manager', 'Chrome', '1.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('--- NOVO QR CODE GERADO ---');
            currentQR = qr;
            currentStatus = 'disconnected';
            io.emit('qr', qr);
            io.emit('status', 'disconnected');
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`Conexão fechada. Código: ${statusCode}. Reconectando: ${shouldReconnect}`);

            currentStatus = 'disconnected';
            currentQR = null;
            io.emit('status', 'disconnected');

            // HANDLE LOGOUT (401)
            if (statusCode === DisconnectReason.loggedOut) {
                console.log('Detectado desconexão pelo dispositivo (Logout). Limpando sessão...');
                try {
                    // 1. Close internal connection watchers
                    sock?.end(undefined);
                    sock = null;

                    // 2. Clear Auth Folder
                    await fs.rm(AUTH_FOLDER, { recursive: true, force: true });
                    console.log('Sessão limpa com sucesso.');

                    // 3. Clear Internal State
                    chats.clear();
                    messages.clear();

                    // 4. Restart completely to generate new QR
                    console.log('Reiniciando serviço para gerar novo QR Code...');
                    setTimeout(connectToWhatsApp, 2000);

                } catch (error) {
                    console.error('Erro ao limpar sessão:', error);
                    // Force restart even if delete fails
                    setTimeout(connectToWhatsApp, 2000);
                }
            } else if (shouldReconnect) {
                // Normal temporary disconnect handling
                setTimeout(connectToWhatsApp, 5000);
            }
        } else if (connection === 'open') {
            console.log('--- WHATSAPP CONECTADO COM SUCESSO ---');
            currentStatus = 'connected';
            currentQR = null;
            io.emit('status', 'connected');
        }
    });

    // Listen for initial history
    sock.ev.on('messaging-history.set', ({ chats: initialChats, messages: initialMessages, isLatest }) => {
        console.log(`Recebido histórico inicial: ${initialChats.length} conversas, ${initialMessages.length} mensagens`);
        for (const chat of initialChats) {
            chats.set(chat.id, {
                id: chat.id,
                name: chat.name || chat.id.split('@')[0],
                lastMessage: 'Histórico carregado',
                conversationTimestamp: chat.conversationTimestamp,
                unreadCount: chat.unreadCount || 0
            });
        }
        for (const msg of initialMessages) {
            const jid = msg.key.remoteJid;
            if (!jid) continue;
            const chatMessages = messages.get(jid) || [];
            chatMessages.push({
                key: msg.key,
                message: msg.message,
                pushName: msg.pushName,
                messageTimestamp: msg.messageTimestamp
            });
            messages.set(jid, chatMessages);
        }
    });

    sock.ev.on('chats.upsert', (newChats) => {
        for (const chat of newChats) {
            const existing = chats.get(chat.id) || {};
            chats.set(chat.id, { ...existing, ...chat });
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                const jid = msg.key.remoteJid;
                if (!jid) continue;

                // Extract message body
                const body = msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    msg.message?.buttonsResponseMessage?.selectedButtonId ||
                    msg.message?.listResponseMessage?.title ||
                    (msg.message?.imageMessage ? '📷 Imagem' :
                        msg.message?.videoMessage ? '🎥 Vídeo' :
                            msg.message?.audioMessage ? '🎵 Áudio' :
                                msg.message?.documentMessage ? '📄 Documento' : '📎 Mídia');

                // Update chat list
                const chat = chats.get(jid) || { id: jid, name: msg.pushName || jid.split('@')[0], unreadCount: 0 };
                chat.lastMessage = body;
                chat.conversationTimestamp = msg.messageTimestamp;
                if (!msg.key.fromMe) chat.unreadCount++;
                chats.set(jid, chat);

                // Update message list
                const chatMessages = messages.get(jid) || [];
                chatMessages.push({
                    key: msg.key,
                    message: msg.message,
                    pushName: msg.pushName,
                    messageTimestamp: msg.messageTimestamp
                });
                // Keep only last 100 messages per chat to save memory
                if (chatMessages.length > 100) chatMessages.shift();
                messages.set(jid, chatMessages);

                // Emit real-time update
                io.emit('new_message', {
                    jid: jid,
                    pushName: msg.pushName,
                    message: body,
                    timestamp: msg.messageTimestamp,
                    fromMe: msg.key.fromMe
                });
            }
        }
    });

    return sock;
}

// --- CONTROLLERS / ROUTES ---

app.get('/health', (req, res) => {
    res.json({ ok: true, status: currentStatus, timestamp: new Date().toISOString() });
});

app.get('/whatsapp/status', (req, res) => {
    res.json({ connected: currentStatus === 'connected' });
});

app.get('/whatsapp/qrcode', (req, res) => {
    res.json({ connected: currentStatus === 'connected', qr: currentQR });
});

app.get('/whatsapp/chats', (req, res) => {
    if (currentStatus !== 'connected') return res.status(400).json({ error: 'WhatsApp offline' });
    const chatList = Array.from(chats.values()).sort((a, b) => (b.conversationTimestamp || 0) - (a.conversationTimestamp || 0));
    res.json(chatList);
});

app.get('/whatsapp/messages/:jid', (req, res) => {
    if (currentStatus !== 'connected') return res.status(400).json({ error: 'WhatsApp offline' });
    const { jid } = req.params;
    const chatMessages = messages.get(jid) || [];
    res.json(chatMessages);
});

app.post('/whatsapp/send', async (req, res) => {
    const { to, message } = req.body;
    if (currentStatus !== 'connected' || !sock) return res.status(400).json({ error: 'WhatsApp offline' });

    try {
        let jid = to;
        if (!jid.includes('@')) jid = to.replace(/\D/g, '') + '@s.whatsapp.net';

        const sentMsg = await sock.sendMessage(jid, { text: message });

        // Optimistically update local message store
        const chatMessages = messages.get(jid) || [];
        chatMessages.push(sentMsg);
        messages.set(jid, chatMessages);

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao enviar:', error);
        res.status(500).json({ error: 'Falha ao enviar' });
    }
});

io.on('connection', (socket) => {
    socket.emit('status', currentStatus);
    if (currentQR) socket.emit('qr', currentQR);
});

connectToWhatsApp().catch(err => console.error("Erro crítico:", err));

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend WhatsApp Ativo na porta ${PORT}`);
});
