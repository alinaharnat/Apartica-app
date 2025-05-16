// server.js
const dotenv = require('dotenv');

// Викликаємо dotenv.config() на самому початку і перевіряємо результат
const dotenvResult = dotenv.config(); // За замовчуванням шукає .env в поточній директорії

if (dotenvResult.error) {
  console.error('!!! ПОМИЛКА завантаження .env файлу !!!', dotenvResult.error);
  // У випадку помилки завантаження .env, можливо, варто зупинити додаток,
  // оскільки критично важливі конфігурації можуть бути відсутні.
  // process.exit(1); // Розкоментуйте, якщо це бажана поведінка
} else {
  console.log('>>> .env файл успішно завантажено.');
  // Розкоментуйте наступний рядок для перегляду завантажених змінних (ТІЛЬКИ ДЛЯ ДІАГНОСТИКИ, не для продакшену!)
  // console.log('>>> Завантажені змінні з .env:', dotenvResult.parsed);
}

// Решта ваших require'ів та ініціалізацій мають йти ПІСЛЯ dotenv.config()
const app = require('./app');
const connectDB = require('./config/connectDB');

// connectDB() тепер може безпечно використовувати process.env.MONGODB_URI
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
