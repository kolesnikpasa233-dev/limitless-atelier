# Деплой Limitless Atelier на Railway

## Структура проекта

```
deploy/
├── server.js          # Express-сервер (API + статика)
├── package.json       # Зависимости и скрипт запуска
├── public/            # Собранный фронтенд
│   ├── index.html
│   ├── favicon.png
│   ├── assets/        # JS + CSS бандлы
│   └── images/        # Изображения секций
└── README_DEPLOY.md   # Эта инструкция
```

## Шаги деплоя

### 1. Создайте проект на Railway

1. Зайдите на [railway.app](https://railway.app) и авторизуйтесь
2. Нажмите **New Project** → **Deploy from GitHub repo** (или загрузите папку `deploy/`)
3. Railway автоматически определит Node.js и запустит `npm start`

### 2. Настройте переменные окружения (ENV)

В настройках проекта на Railway → **Variables** добавьте:

| Переменная | Описание | Обязательно |
|---|---|---|
| `GROQ_API_KEY` | API-ключ Groq для чат-ассистента | Да (для чата) |
| `BITRIX_WEBHOOK_URL` | Webhook URL Bitrix24 CRM для формы заявок | Да (для формы) |
| `OPENAI_API_KEY` | API-ключ OpenAI (зарезервировано на будущее) | Нет |
| `PORT` | Порт сервера (Railway задаёт автоматически) | Нет |

### 3. Деплой

Railway выполнит автоматически:
- `npm install` — установка зависимостей
- `npm start` → `node server.js` — запуск сервера

### 4. Проверка

После деплоя откройте URL вашего проекта и проверьте:

**Главная страница:**
```
https://ваш-проект.up.railway.app/
```

**API — расписание:**
```
curl https://ваш-проект.up.railway.app/api/schedule
```

Ожидаемый ответ:
```json
{
  "schedule": {
    "monday": "10:00–20:00",
    "tuesday": "10:00–20:00",
    ...
    "sunday": "выходной"
  },
  "note": "Посещение только по предварительной записи",
  "phone": "+7 (985) 457-23-27",
  "address": "Москва, ул. Петровка 15/13, стр. 3"
}
```

**API — статистика:**
```
curl https://ваш-проект.up.railway.app/api/stats
```

**API — бронирование:**
```
curl -X POST https://ваш-проект.up.railway.app/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"name": "Тест", "phone": "+79851234567"}'
```

## API эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/schedule` | Расписание работы ателье |
| POST | `/api/bookings` | Создать бронирование (name, phone, date?, time?, service?) |
| GET | `/api/stats` | Статистика сервера |
| POST | `/api/contact` | Форма обратной связи → Bitrix24 CRM |
| POST | `/api/chat` | AI чат-ассистент (расчёт стоимости) |

## Примечания

- Бронирования хранятся в памяти сервера (при рестарте сбрасываются). Для постоянного хранения подключите базу данных.
- Чат-ассистент использует Groq API (Llama 3.3 70B для текста, Llama 4 Scout для анализа фото).
- Все API-ключи хранятся в переменных окружения и недоступны из фронтенда.
