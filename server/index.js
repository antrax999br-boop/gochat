import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pino from 'pino';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;

let currentQR = null;
let currentStatus = 'disconnected';

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('Novo QR Code gerado');
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
            console.log('Conexão aberta com sucesso!');
            currentStatus = 'connected';
            currentQR = null;
            io.emit('status', 'connected');
        }
    });

    io.on('connection', (socket) => {
        console.log('Cliente conectado ao Socket.IO');
        socket.emit('status', currentStatus);
        if (currentQR) {
            socket.emit('qr', currentQR);
        }
    });
}

connectToWhatsApp().catch(err => console.log("Erro inesperado: " + err));

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
