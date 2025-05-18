// server.js
const dotenv = require('dotenv');

// Call dotenv.config() at the very beginning and check the result
const dotenvResult = dotenv.config(); // By default, it looks for .env in the current directory

if (dotenvResult.error) {
  console.error('!!! ERROR loading .env file !!!', dotenvResult.error);
  // If there's an error loading the .env file, it's possible that critical configurations are missing.
  // process.exit(1); // Uncomment if you want to stop the app in this case
} else {
  console.log('>>> .env file successfully loaded.');
  // Uncomment the line below to view the loaded environment variables (FOR DEBUGGING ONLY, NOT FOR PRODUCTION!)
  // console.log('>>> Loaded variables from .env:', dotenvResult.parsed);
}

// All other requires and initializations should go AFTER dotenv.config()
const app = require('./app');
const connectDB = require('./config/connectDB');

// connectDB() can now safely use process.env.MONGODB_URI
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
