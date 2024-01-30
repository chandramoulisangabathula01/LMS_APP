const app = require('./app'); // Import the app instance from app.js

const PORT =  3002; // Use the provided environment variable or default to 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});