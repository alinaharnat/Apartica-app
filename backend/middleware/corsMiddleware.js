const express = require('express');
const cors = require('cors');
const app = express();

// Дозволити CORS для всіх запитів
app.use(cors());

// Інші middleware та маршрути
app.use(express.json());
app.use('/api', require('./routes/api'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порту ${PORT}`);
});
