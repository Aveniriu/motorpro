// server.js — безопасный сервер с админ-панелью
const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Защита от брутфорса
const loginAttempts = new Map(); // IP → { count, lastAttempt }
const MAX_ATTEMPTS = 3;
const BLOCK_TIME = 15 * 60 * 1000; // 15 минут

// Настройки
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = 'romaqwertybarotrawma2025'; // ← твой пароль в открытом виде (временно)
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);
const DATA_FILE = path.join(__dirname, 'data', 'content.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Создаём папку data, если её нет
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Создаём content.json, если его нет
if (!fs.existsSync(DATA_FILE)) {
  const initialContent = {
    ru: {
      site: { title: 'ООО НПП МоторПро - Бесколлекторные двигатели для БПЛА' },
      nav: { brand: 'МоторПро', problem: 'Проблема', product: 'Продукт', competitors: 'Конкуренты', technology: 'Технологии', results: 'Результаты', team: 'Команда', contacts: 'Контакты' },
      hero: { title: 'ООО НПП «МоторПро»', subtitle: 'Мы помогаем БПЛА летать', description: 'Создаем малоразмерные бесколлекторные двигатели постоянного тока', cta: 'Узнать больше' },
      problem: {
        title: 'ПРОБЛЕМА',
        description: 'Увеличение рыночного спроса...',
        items: ['1. Санкции при закупках', '2. Логистические сложности', '3. Отсутствие отечественных аналогов']
      },
    },
    en: {},
    zh: {}
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialContent, null, 2));
}

// Создаём приложение
const app = express();

// === ПРАВИЛЬНАЯ CORS-ПОЛИТИКА (решает проблему preflight) ===
app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Ответ на preflight-запрос
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// Разрешаем JSON в запросах
app.use(express.json({ limit: '1mb' }));

// Отдаём статику (твой сайт)
app.use(express.static(PUBLIC_DIR));

// API: получить контент
// API: получить контент
app.get('/api/content', (req, res) => {
    const auth = req.headers.authorization;
    
    // Если заголовок Authorization есть — проверяем пароль
    if (auth && auth.startsWith('Bearer ')) {
        const password = auth.substring(7);
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        // Защита от брутфорса
        if (loginAttempts.has(ip)) {
            const { count, lastAttempt } = loginAttempts.get(ip);
            if (now - lastAttempt < BLOCK_TIME && count >= MAX_ATTEMPTS) {
                return res.status(429).json({ error: 'Слишком много попыток. Попробуйте позже.' });
            }
        }

        // Проверка пароля
        if (!bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
            const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
            attempts.count += 1;
            attempts.lastAttempt = now;
            loginAttempts.set(ip, attempts);
            return res.status(403).json({ error: 'Неверный пароль' });
        }

        loginAttempts.delete(ip);
    }

    // Отдаём контент
    try {
        const content = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'Не удалось загрузить контент' });
    }
});

// API: обновить контент (требует пароль)
app.post('/api/content', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const password = auth.substring(7); // "Bearer пароль" → берём "пароль"

    // Защита от брутфорса
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (loginAttempts.has(ip)) {
        const { count, lastAttempt } = loginAttempts.get(ip);
        if (now - lastAttempt < BLOCK_TIME && count >= MAX_ATTEMPTS) {
            return res.status(429).json({ error: 'Слишком много попыток. Попробуйте позже.' });
        }
    }

    if (!bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
        attempts.count += 1;
        attempts.lastAttempt = now;
        loginAttempts.set(ip, attempts);
        return res.status(403).json({ error: 'Неверный пароль' });
    }

    loginAttempts.delete(ip);

    // Сохраняем новый контент
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Не удалось сохранить' });
    }
});

// Все остальные запросы → index.html
// API: получить контент (требует пароль для защиты)
app.get('/api/content', (req, res) => {
    // Для публичного сайта можно разрешить без пароля,
    // но для админки — проверяем.
    // Однако: сайт тоже использует /api/content!
    // Поэтому сделаем так: если есть Authorization — проверяем,
    // если нет — отдаём контент (для публичного сайта).

    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
        const password = auth.substring(7);
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();

        if (loginAttempts.has(ip)) {
            const { count, lastAttempt } = loginAttempts.get(ip);
            if (now - lastAttempt < BLOCK_TIME && count >= MAX_ATTEMPTS) {
                return res.status(429).json({ error: 'Слишком много попыток. Попробуйте позже.' });
            }
        }

        if (!bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
            const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
            attempts.count += 1;
            attempts.lastAttempt = now;
            loginAttempts.set(ip, attempts);
            return res.status(403).json({ error: 'Неверный пароль' });
        }

        loginAttempts.delete(ip);
    }

    // Отдаём контент (и публичному сайту, и админке)
    try {
        const content = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'Не удалось загрузить контент' });
    }
});

// Запуск
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  console.log(`🔒 Защищено паролем`);
});