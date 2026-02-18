import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

const BITRIX_WEBHOOK_URL = process.env.BITRIX_WEBHOOK_URL || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SLOT_START_HOUR = 10;
const SLOT_END_HOUR = 22;
const SLOT_DURATION_HOURS = 2;
const SCHEDULE_DAYS = 14;

const FORMAT_LABELS = {
  open_game: 'Открытая игра',
  training: 'Тренировка с тренером',
  subscription: 'Абонемент (4 игры)',
  corporate: 'Корпоратив / ДР',
};

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, 'public')));

const PRICE_LIST = `
=== ИНДИВИДУАЛЬНЫЙ ПОШИВ ===

--- Основы изделий (цена без ткани) ---
Топ — от 14 000 ₽
Платье-футляр без рукава — от 25 000 ₽
Платье прямое с рукавом — от 29 000 ₽
Платье с отрезной талией — от 35 000 ₽
Юбка прямая до колена — от 15 000 ₽
Юбка по косой — от 20 000 ₽
Блуза с длинным рукавом — от 27 000 ₽
Блуза без рукава — от 20 000 ₽
Брюки женские (два кармана) — от 24 000 ₽
Брюки спорт — от 19 000 ₽
Джинсы — от 30 000 ₽
Жилет — от 24 000 ₽
Жакет «шанель» на органзе — от 55 000 ₽
Жакет — от 48 000 ₽
Пальто — от 77 000 ₽
Плащ — от 68 000 ₽
Сорочка с длинным рукавом — от 24 000 ₽
Классические брюки — от 30 000 ₽
Лонгслив трикотажный — от 14 000 ₽
Худи с капюшоном — от 16 000 ₽
Свитшот трикотажный — от 14 000 ₽
Футболка — от 8 000 ₽
Куртка без подкладки — от 35 000 ₽
Корсет — от 50 000 ₽
Пиджак мужской кэжуал — от 65 000 ₽
Пиджак мужской беспоук — от 120 000 ₽
Бейсболка — от 10 000 ₽
Бомбер мужской без подкладки — от 35 000 ₽
Парка без подкладки — от 48 000 ₽
Сорочка мужская — от 25 000 ₽
Пальто зимнее — от 125 000 ₽
Жилет пуховой (короткий) — от 40 000 ₽
Пуховик короткий — от 65 000 ₽
Пуховик длинный — от 80 000 ₽
Дублёнка короткая — от 75 000 ₽
Парка на меховой подкладке (короткая) — от 150 000 ₽

--- Усложняющие элементы (надбавки к базовой цене) ---
Подкладка — +50%
Ткань: клетка, полоска, крупный рисунок — +20%
Белая ткань — +20%
Шифон, бархат, велюр, кружево — +50%
Кожа, мех — +100%
Дополнительные рельефы — +15%
Рукав реглан — +15%
Отрезная талия, доп. сечения — +10%
Капюшон — +20%
Фантазийный / сложный воротник — +20%
Супатная застёжка, клеванты — +15%
Дополнительные карманы — 2 000 ₽ / шт.
Отделочные строчки — +5%
Ручной стяжек — 300 ₽ / 10 см
Обработка в окантовку — 200 ₽ / 10 см
Ткань дабл — +50%
Манжеты, шлицы — +10%
Пояс — +2 000 ₽
Декоративные элементы — от 1 000 ₽
Изготовление декор. тесьмы (шанель) — 250 ₽ / 10 см
Канты — 150 ₽ / 10 см
Размер свыше 56 — +20%
Кокетка отлётная — от 2 000 ₽
Погоны, паты — от 500 ₽ / шт.
Длинное изделие — +25%
Шов «американка» — 300 ₽ / 10 см
Оверлок ролевый — 150 ₽ / 10 см
Вышивка на рубашке (инициалы), ручная — 1 000 ₽ / 2 буквы
Меховой воротник отложной — от 8 000 ₽
Меховой воротник английский — от 15 000 ₽
Манжеты меховые — от 10 000 ₽
Строчка по трикотажу с застилом — +20%
Усложнённый крой — +50%

=== КОРРЕКТИРОВКА ИЗДЕЛИЙ ===
(Указаны минимальные цены. На подкладке +50%.)

--- Пиджак ---
Длина рукава через шлицу, с переносом петель — от 4 500 ₽
Длина рукава через низ без переноса петель со шлицей — от 2 500 ₽
Длина рукава через окат с плечевыми накладками — от 5 500 ₽
Длина рукава через окат, облегчённый вариант — от 3 500 ₽
Корректировка проймы, длина плеча — от 5 000 ₽
Ушить / расставить по среднему шву без шлицы — от 1 200 ₽
Ушить / расставить по среднему шву со шлицей — от 2 500 ₽
Ушить / расставить по рельефам без шлиц — от 3 000 ₽
Ушить / расставить по рельефам со шлицей — от 4 500 ₽
Корректировка линии ростка без плечевых — от 2 700 ₽
Корректировка линии ростка с плечевыми — от 4 500 ₽
Изменение длины изделия — от 2 500 ₽
Изменение длины изделия с одной шлицей — от 3 500 ₽
Изменение длины изделия с 2 шлицами — от 4 500 ₽
Ушить рукава по переднему шву с корректировкой низа — от 2 200 ₽
Ушить рукава по локтевому до шлицы — от 2 200 ₽
Замена подкладки частичная — от 3 000 ₽
Замена подкладки полная с изготовлением карманов — от 14 000 ₽
Восстановление ручного стяжка (10 см) — от 200 ₽

--- Брюки ---
Ушить / расшить средний шов пояса — от 1 500 ₽
Ушить / расшить по боковым без затрагивания пояса — от 1 800 ₽
Ушить / расшить по боковым с затрагиванием пояса — от 3 000 ₽
Ушить / расшить по шаговым — от 1 500 ₽
Коррекция переднезаднего баланса — от 3 000 ₽
Изменение длины с тесьмой — от 1 800 ₽
Изменение длины под строчку (чиносы) — от 1 500 ₽
Изменение длины с манжетой (с тесьмой) — от 2 000 ₽
Изменение длины с манжетой без тесьмы — от 1 800 ₽
Восстановить мешковину кармана — от 2 500 ₽
Перекрой задней половинки — от 3 500 ₽
Перенос окантовки (10 см) — от 200 ₽
Углубить шов сиденья — от 1 000 ₽

--- Джинсы ---
Изменение длины с сохранением вара — от 2 300 ₽
Изменение длины без сохранения вара — от 1 800 ₽
Изменить объём талии (ушить пояс, отформовать кокетку) — от 2 700 ₽
Ушить по боковым или шаговым без отделочной строчки — от 2 300 ₽
Ушить по боковым или шаговым с отделочной строчкой — от 2 500 ₽
Штопка (1 кв. см) — от 500 ₽
Штопка под карманами с восстановлением строчек (1 карман) — от 1 200 ₽
Замена молнии с вмешательством в пояс — от 2 500 ₽
Изменение баланса (перенос шлевок) — от 3 000 ₽
Замена мешковины кармана — от 2 500 ₽

--- Сорочка / Блузка ---
Изменение длины рукава с переносом планки — от 3 000 ₽
Изменение длины рукава без переноса планки — от 2 000 ₽
Изменение длины изделия с восст. уголков по боковым — от 2 250 ₽
Изменение длины изделия — от 1 500 ₽
Ушить по вытачкам — от 1 000 ₽
Ушить по боковым (запаковочный шов) — от 2 500 ₽
Ушить по боковым под оверлок — от 1 500 ₽
Ушить рукава (запаковочный шов) до манжеты — от 2 500 ₽
Ушить рукава под оверлок — от 1 500 ₽
Корректировка проймы (запаковочный шов) — от 3 000 ₽
Корректировка проймы под оверлок — от 2 000 ₽
Корректировка баланса (кокетка) — от 2 500 ₽

--- Юбка ---
Изменение длины прямого силуэта без шлицы — от 2 000 ₽
Изменение длины прямого силуэта со шлицей — от 2 500 ₽
Изменение длины (полусолнце или клинья) — от 2 700 ₽
Ушить по боковым — от 1 500 ₽
Ушить по среднему с переносом молнии — от 2 000 ₽
Корректировка баланса — от 2 000 ₽
Шов «американка» (10 см) — от 150 ₽
Ролевый шов (10 см) — от 100 ₽

--- Платье ---
Изменение длины бретелей — от 1 500 ₽
Изменение баланса с перекроем плечевого пояса — от 3 000 ₽
Коррекция пройм — от 3 000 ₽
Корректировка линии талии с переносом молнии — от 3 000 ₽
Ушить по боковым или рельефам — от 2 500 ₽
Ушить по вытачкам по спинке или переду — от 1 500 ₽
Перенос / замена молнии — от 2 000 ₽
Ушить длинные рукава без корректировки низа — от 1 900 ₽
Ушить рукава с корректировкой низа — от 2 200 ₽
Изменение длины подкладки (прямой крой) — от 1 300 ₽
Изготовить подкладку (прямой крой, без ткани) — от 15 000 ₽

--- Пуховики ---
Укоротить рукава по низу — от 5 000 ₽
Укоротить рукава через окат — от 9 000 ₽
Укоротить длину — от 5 000 ₽
Ушить по боковым или рельефам — от 9 000 ₽
Ушить по среднему шву — от 4 500 ₽

--- Дополнительно ---
Изготовление глазковой петли — 350 ₽
Пришить пуговицу — 150 ₽
Поставить кнопку — 250 ₽
Замена молнии на ветрозащитном клапане — от 4 000 ₽
Замена молнии с кантами на ветрозащитном клапане — от 6 000 ₽
Ремонт кармана (1 ед.) — от 2 500 ₽
Замена молнии без ветрозащитного клапана — от 4 000 ₽

--- Трикотаж ---
Укоротить футболку на распошиве — от 1 200 ₽
Укоротить футболку с разрезами по бокам — от 1 500 ₽
Укоротить рукава на футболке — от 1 200 ₽
Укоротить низ трикотаж 7–10 класс (петля в петлю) — от 8 000 ₽
Укоротить низ трикотаж 10–14 класс (петля в петлю) — от 12 000 ₽

--- Галантерея ---
Пробивка отверстия в ремне — 140 ₽
Укорачивание ремня с винтовым отверстием — 170 ₽
`;

const SYSTEM_PROMPT = `Ты — виртуальный помощник ателье «Limitless», расположенного по адресу: Москва, ул. Петровка 15/13, стр. 3. Посещение только по записи. Телефон для связи: +7 (985) 457-23-27. Твоя задача — помочь клиенту рассчитать примерную стоимость услуг на основе прайс-листа ателье.

ПРАВИЛА:
1. Общайся вежливо, профессионально и лаконично. Используй обращение на «вы».
2. Задавай последовательные уточняющие вопросы, чтобы точно определить нужные услуги.
3. Сначала выясни, что именно нужно клиенту: пошив нового изделия или корректировка существующего.
4. Для пошива уточни: тип изделия, ткань (обычная, клетка/полоска, шифон/бархат, кожа/мех), нужна ли подкладка, капюшон, сложный воротник, дополнительные карманы, размер (больше 56 или нет), длина (длинное или стандартное), и другие усложняющие элементы.
5. Для корректировки уточни: тип изделия (пиджак, брюки, джинсы и т.д.), конкретный вид работы, есть ли подкладка (надбавка +50%).
6. После каждого уточнения добавляй услугу к расчёту.
7. Когда все детали собраны, выведи итоговый расчёт в виде списка позиций с ценами и общую сумму.
8. Если процентная надбавка, рассчитай её от базовой цены и покажи в рублях.
9. Цены указаны минимальные (с пометкой «от»). Предупреди клиента, что окончательная стоимость определяется на консультации.
10. Если клиент спрашивает о чём-то, что не входит в прайс-лист, скажи, что стоимость определяется индивидуально на консультации, и предложи записаться.
11. Не выдумывай цены, которых нет в прайс-листе.
12. Отвечай только на русском языке.
13. Не используй Markdown-форматирование. Пиши простым текстом без звёздочек, решёток и других символов разметки.
14. Если клиент отправил фотографию изделия, внимательно проанализируй его: определи тип изделия (платье, пиджак, пальто и т.д.), оцени сложность кроя, наличие подкладки, тип ткани, декоративные элементы (кружево, вышивка, драпировка), длину, силуэт. На основе этого анализа рассчитай примерную стоимость пошива аналогичного изделия по прайс-листу. Перечисли все замеченные детали и соответствующие позиции прайса.
15. При анализе фотографии задавай уточняющие вопросы о деталях, которые не видны на фото (размер, тип ткани, нужна ли подкладка и т.д.).

ПРАЙС-ЛИСТ:
${PRICE_LIST}`;

function mskNow() {
  return DateTime.now().setZone('Europe/Moscow');
}

function buildFormParams(params) {
  const search = new URLSearchParams();

  const append = (key, value) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => append(`${key}[${index}]`, item));
      return;
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([childKey, childVal]) => {
        append(`${key}[${childKey}]`, childVal);
      });
      return;
    }
    search.append(key, String(value));
  };

  Object.entries(params).forEach(([key, value]) => append(key, value));
  return search;
}

async function bitrixRequest(method, params = {}, retries = 2) {
  if (!BITRIX_WEBHOOK_URL) {
    console.error('[Bitrix] BITRIX_WEBHOOK_URL not configured');
    return null;
  }

  const url = `${BITRIX_WEBHOOK_URL}${method}.json`;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const body = buildFormParams(params);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('[Bitrix] invalid JSON', text.slice(0, 200));
        throw new Error('Invalid JSON');
      }

      if (data && data.error) {
        console.error('[Bitrix] API error', data.error, data.error_description || '');
        return null;
      }

      return data;
    } catch (err) {
      console.error('[Bitrix] request failed', err.message);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  return null;
}

async function getBookedSlotsFromBitrix(startDate, endDate) {
  const booked = [];
  let start = 0;

  while (true) {
    const result = await bitrixRequest('crm.lead.list', {
      filter: {
        '%TITLE': '[ATELIER]',
        '!STATUS_ID': ['JUNK', 'CONVERTED'],
      },
      select: ['ID', 'TITLE', 'COMMENTS'],
      order: { ID: 'DESC' },
      start,
    });

    if (!result || !Array.isArray(result.result)) break;
    if (result.result.length === 0) break;

    for (const lead of result.result) {
      const comments = lead.COMMENTS || '';
      const match = comments.match(/SLOT_DATE:(\d{4}-\d{2}-\d{2})\|SLOT_TIME:(\d{2}:\d{2})/);
      if (match) {
        const slotDate = match[1];
        const slotTime = match[2];
        if (slotDate >= startDate && slotDate <= endDate) {
          booked.push(`${slotDate}|${slotTime}`);
        }
      }
    }

    start = result.next || 0;
    if (!start) break;
  }

  return booked;
}

function isValidSlot(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:00$/.test(time)) {
    return false;
  }

  const hour = parseInt(time.slice(0, 2), 10);
  if (hour < SLOT_START_HOUR || hour >= SLOT_END_HOUR) return false;
  if ((hour - SLOT_START_HOUR) % SLOT_DURATION_HOURS !== 0) return false;

  const now = mskNow();
  const slotDt = DateTime.fromISO(`${date}T${time}`, { zone: 'Europe/Moscow' });
  if (slotDt <= now) return false;

  const maxDate = now.plus({ days: SCHEDULE_DAYS });
  if (slotDt > maxDate) return false;

  return true;
}

function generateConfirmationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// --- API Routes ---
app.post('/api/contact', async (req, res) => {
  const { name, phone, email, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  try {
    const fields = {
      TITLE: `Заявка с сайта: ${name}`,
      NAME: name,
      PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
      SOURCE_ID: 'WEB',
      COMMENTS: message || '',
    };
    if (email) {
      fields.EMAIL = [{ VALUE: email, VALUE_TYPE: 'WORK' }];
    }

    const bitrixData = await bitrixRequest('crm.lead.add', { fields });
    if (bitrixData?.result) {
      console.log(`[Contact Form] Lead created in Bitrix24, ID: ${bitrixData.result}`);
    } else {
      console.error('[Contact Form] Bitrix24 error:', JSON.stringify(bitrixData));
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[Contact Form] Failed to create Bitrix24 lead:', err);
    return res.json({ success: true });
  }
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }
  if (messages.length > 50) {
    return res.status(400).json({ error: 'Слишком длинная переписка. Начните новый диалог.' });
  }
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg?.content && !lastMsg?.image) {
    return res.status(400).json({ error: 'Сообщение пустое.' });
  }
  if (lastMsg?.content && (typeof lastMsg.content !== 'string' || lastMsg.content.length > 2000)) {
    return res.status(400).json({ error: 'Сообщение слишком длинное.' });
  }

  const imageCount = messages.filter((m) => !!m.image).length;
  if (imageCount > 5) {
    return res.status(400).json({ error: 'Слишком много изображений. Начните новый диалог.' });
  }

  for (const m of messages) {
    if (m.image) {
      if (typeof m.image !== 'string' || !m.image.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Неверный формат изображения.' });
      }
      if (m.image.length > 6 * 1024 * 1024) {
        return res.status(400).json({ error: 'Изображение слишком большое. Максимум 4 МБ.' });
      }
    }
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    for (const m of messages) {
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      if (m.image && role === 'user') {
        const contentParts = [];
        if (m.content) {
          contentParts.push({ type: 'text', text: m.content });
        }
        contentParts.push({
          type: 'image_url',
          image_url: { url: m.image },
        });
        chatMessages.push({ role, content: contentParts });
      } else {
        chatMessages.push({ role, content: m.content || '' });
      }
    }

    const hasAnyImage = messages.some((m) => !!m.image);
    const model = hasAnyImage
      ? 'meta-llama/llama-4-scout-17b-16e-instruct'
      : 'llama-3.3-70b-versatile';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[Groq API Error]', response.status, errBody);
      if (response.status === 429) {
        return res.status(429).json({ error: 'Превышен лимит запросов. Пожалуйста, попробуйте позже.' });
      }
      return res.status(500).json({ error: 'Не удалось получить ответ. Попробуйте позже.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';

    return res.json({ reply });
  } catch (error) {
    console.error('[Chat Error]', error?.message || error);
    return res.status(500).json({ error: 'Не удалось получить ответ. Попробуйте позже.' });
  }
});

app.get('/api/schedule', async (req, res) => {
  const schedule = [];
  let booked = [];

  try {
    const now = mskNow();
    const today = now.startOf('day');
    const endDate = today.plus({ days: SCHEDULE_DAYS });

    booked = await getBookedSlotsFromBitrix(today.toISODate(), endDate.toISODate());
    if (!Array.isArray(booked)) booked = [];
  } catch (err) {
    console.error('[Schedule] Bitrix error', err?.message || err);
    booked = [];
  }

  const now = mskNow();
  const today = now.startOf('day');

  for (let i = 0; i < SCHEDULE_DAYS; i += 1) {
    const day = today.plus({ days: i });
    const dateStr = day.toISODate();

    const slots = [];
    let hour = SLOT_START_HOUR;
    while (hour < SLOT_END_HOUR) {
      const endHour = hour + SLOT_DURATION_HOURS;
      const timeStr = `${String(hour).padStart(2, '0')}:00`;
      const endTimeStr = `${String(endHour).padStart(2, '0')}:00`;

      let isPast = false;
      if (day.hasSame(now, 'day') && hour <= now.hour) {
        isPast = true;
      }

      const key = `${dateStr}|${timeStr}`;
      const available = !booked.includes(key) && !isPast;

      slots.push({
        id: `${dateStr}-${timeStr}`,
        time: timeStr,
        end_time: endTimeStr,
        available,
      });

      hour += SLOT_DURATION_HOURS;
    }

    schedule.push({ date: dateStr, slots });
  }

  return res.json(schedule);
});

app.post('/api/bookings', async (req, res) => {
  const { name = '', phone = '', email = '', date = '', time = '', format_type = '' } = req.body || {};

  if (!name || !phone || !date || !time || !format_type) {
    return res.status(400).json({
      status: 'error',
      detail: 'Пожалуйста, заполните все обязательные поля: имя, телефон, email, дату и время игры.',
      error_type: 'missing_fields',
    });
  }

  if (!isValidSlot(date, time)) {
    return res.status(400).json({
      status: 'error',
      detail: 'Выбранное время недоступно для бронирования. Пожалуйста, выберите другой слот.',
      error_type: 'invalid_time',
    });
  }

  if (!FORMAT_LABELS[format_type]) {
    return res.status(400).json({
      status: 'error',
      detail: 'Выбран неверный формат игры. Пожалуйста, выберите из доступных вариантов.',
      error_type: 'invalid_format',
    });
  }

  if (!BITRIX_WEBHOOK_URL) {
    return res.status(500).json({
      status: 'error',
      detail: 'CRM не настроена. Пожалуйста, попробуйте позже.',
      error_type: 'system_error',
    });
  }

  const formatLabel = FORMAT_LABELS[format_type];
  const startDt = DateTime.fromISO(`${date}T${time}`, { zone: 'Europe/Moscow' });
  const endDt = startDt.plus({ hours: SLOT_DURATION_HOURS });

  const today = mskNow();
  const endDate = today.plus({ days: SCHEDULE_DAYS });
  let booked = await getBookedSlotsFromBitrix(today.toISODate(), endDate.toISODate());
  if (!Array.isArray(booked)) booked = [];

  const key = `${date}|${time}`;
  if (booked.includes(key)) {
    return res.status(400).json({
      status: 'error',
      detail: 'Это время уже занято. Пожалуйста, выберите другой свободный слот.',
      error_type: 'slot_already_booked',
    });
  }

  const confirmationCode = generateConfirmationCode();
  const bookingId = randomUUID();

  const leadTitle = `[ATELIER] ${formatLabel} — ${name} (Kod: ${confirmationCode})`;
  const leadComments = `SLOT_DATE:${date}|SLOT_TIME:${time}\n\nKod: ${confirmationCode}\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nFormat: ${formatLabel}\nDate: ${date}\nTime: ${time} — ${endDt.toFormat('HH:mm')}`;

  const result = await bitrixRequest('crm.lead.add', {
    fields: {
      TITLE: leadTitle,
      NAME: name,
      PHONE: [{ VALUE: phone, VALUE_TYPE: 'MOBILE' }],
      EMAIL: [{ VALUE: email, VALUE_TYPE: 'WORK' }],
      COMMENTS: leadComments,
      SOURCE_ID: 'WEB',
      STATUS_ID: 'NEW',
    },
  });

  if (!result || !result.result) {
    return res.json({
      status: 'error',
      detail: 'Не удалось создать бронирование в системе. Пожалуйста, попробуйте еще раз или свяжитесь с администратором.',
      error_type: 'system_error',
    });
  }

  return res.json({
    id: bookingId,
    confirmation_code: confirmationCode,
    name,
    phone,
    email,
    date,
    time,
    format_type,
    status: 'confirmed',
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalBookings: 0,
    services: {
      tailoring: 'Индивидуальный пошив',
      alterations: 'Корректировка изделий',
      restoration: 'Реставрация',
    },
    uptime: process.uptime(),
  });
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Limitless server running on port ${PORT}`);
});
