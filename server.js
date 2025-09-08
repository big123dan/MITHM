import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/payment_original", (req, res) => {
    console.log("💳 Оригинальный сайт получил:", req.body);
    res.json({ status: "success", message: "Оплата обработана" });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Оригинальный сайт → http://localhost:8080`);
});