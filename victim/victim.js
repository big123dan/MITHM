import axios from 'axios';

// Жертва думает, что заходит на оригинальный сайт
const TARGET_URL = 'http://mitm-attack:8081'; // MITM-сервер

async function simulateVictim() {
    console.log("👤 Жертва: Заходит на сайт...");
    
    try {
        // Получаем главную страницу
        const pageResponse = await axios.get(TARGET_URL);
        console.log("👤 Жертва: Страница загружена");
        
        // Отправляет данные оплаты
        const paymentData = {
            card: "4532123456789012",
            cvv: "123"
        };
        
        console.log("👤 Жертва: Отправляет данные оплаты...");
        const paymentResponse = await axios.post(
            TARGET_URL + '/api/payment',
            paymentData,
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
        console.log("👤 Жертва: Получен ответ:", paymentResponse.data);
        
    } catch (error) {
        console.log("👤 Жертва: Ошибка:", error.message);
    }
}

// Запускаем симуляцию через 3 секунды
setTimeout(simulateVictim, 3000);