const path = require('path');
const express = require('express');
const app = express();
const mainRouter = require('./mainRoutes'); // Assuming this is where your routes are

// Route for the main page (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html')); // Path to your index.html file
});

// Start the server
app.listen(3000, () => {
  console.log('Express server running on port 3000');
});
