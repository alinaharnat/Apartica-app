const app = require('./app');
const connectDB = require('./config/connectDB');
const dotenv = require('dotenv');

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});