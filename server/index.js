import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pino from 'pino';
import cors from 'cors';

// --- CONFIGURATION ---
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- STATE MANAGEMENT ---
let currentQR = null;
let currentStatus = 'disconnected';
let sock = null;

// --- WHATSAPP SERVICE ---
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('--- NOVO QR CODE GERADO ---');
            currentQR = qr;
            currentStatus = 'disconnected';
            io.emit('qr', qr);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexão fechada. Reconectando:', shouldReconnect);
            currentStatus = 'disconnected';
            currentQR = null;
            io.emit('status', 'disconnected');
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('--- WHATSAPP CONECTADO ---');
            currentStatus = 'connected';
            currentQR = null;
            io.emit('status', 'connected');
        }
    });

    // Handle messages or other events if needed in the future
    return sock;
}

// --- CONTROLLERS / ROUTES ---

/**
 * Get current connection status
 */
app.get('/whatsapp/status', (req, res) => {
    res.json({ connected: currentStatus === 'connected' });
});

/**
 * Get QR Code or connection status
 */
app.get('/whatsapp/qrcode', (req, res) => {
    res.json({
        connected: currentStatus === 'connected',
        qr: currentQR
    });
});

/**
 * Send a message
 */
app.post('/whatsapp/send', async (req, res) => {
    const { to, message } = req.body;

    if (currentStatus !== 'connected' || !sock) {
        return res.status(400).json({ error: 'WhatsApp não está conectado' });
    }

    if (!to || !message) {
        return res.status(400).json({ error: 'Destinatário (to) e mensagem são obrigatórios' });
    }

    try {
        // Format number: remove characters and add @s.whatsapp.net
        const jid = to.replace(/\D/g, '') + '@s.whatsapp.net';
        await sock.sendMessage(jid, { text: message });
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Falha ao enviar mensagem' });
    }
});

// --- SOCKET HANDLER (EXTRA) ---
io.on('connection', (socket) => {
    console.log('Cliente conectado ao Socket.IO');
    socket.emit('status', currentStatus);
    if (currentQR) socket.emit('qr', currentQR);
});

// --- STARTUP ---
connectToWhatsApp().catch(err => console.log("Erro ao inicializar Baileys: " + err));

server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`Backend WhatsApp Ativo: http://localhost:${PORT}`);
    console.log(`========================================\n`);
});
