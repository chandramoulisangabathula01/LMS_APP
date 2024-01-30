const app = require('./app'); // Import the app instance from app.js

const PORT = process.env.PORT || 3001; // Use the provided environment variable or default to 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});