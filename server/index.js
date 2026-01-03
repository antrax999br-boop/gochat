import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pino from 'pino';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const AUTH_FOLDER = path.join(__dirname, 'auth_info_baileys');

app.use(cors());
app.use(express.json());

// Log requests to help debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

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
    console.log(`Iniciando serviço WhatsApp (Sessão: ${AUTH_FOLDER})...`);
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

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('--- NOVO QR CODE GERADO ---');
            currentQR = qr;
            currentStatus = 'disconnected';
            io.emit('qr', qr);
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`Conexão fechada. Código: ${statusCode}. Reconectando: ${shouldReconnect}`);

            currentStatus = 'disconnected';
            currentQR = null;
            io.emit('status', 'disconnected');

            if (shouldReconnect) {
                console.log('Tentando reconectar em 5 segundos...');
                setTimeout(connectToWhatsApp, 5000); // Adicionado delay para evitar loops infinitos rápidos
            }
        } else if (connection === 'open') {
            console.log('--- WHATSAPP CONECTADO COM SUCESSO ---');
            currentStatus = 'connected';
            currentQR = null;
            io.emit('status', 'connected');
        }
    });

    return sock;
}

// --- CONTROLLERS / ROUTES ---

/**
 * Health Check
 */
app.get('/health', (req, res) => {
    res.json({ ok: true, status: currentStatus, timestamp: new Date().toISOString() });
});

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
    socket.emit('status', currentStatus);
    if (currentQR) socket.emit('qr', currentQR);
});

// --- STARTUP ---
connectToWhatsApp().catch(err => {
    console.error("Erro crítico ao inicializar Baileys:", err);
    // Não encerra o processo para que o servidor Express continue vivo
});

server.listen(PORT, '0.0.0.0', () => { // Explicitly listen on all interfaces
    console.log(`\n========================================`);
    console.log(`Backend WhatsApp Ativo: http://localhost:${PORT}`);
    console.log(`Endpoint de Saúde: http://localhost:${PORT}/health`);
    console.log(`========================================\n`);
});

