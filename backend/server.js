const express = require('express');
const connectDB = require('./connectDB');
require('dotenv').config();

console.log('Server file loaded');

const app = express();

connectDB();

app.get('/', (req, res) => {
  res.send('Hello, MongoDB!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
