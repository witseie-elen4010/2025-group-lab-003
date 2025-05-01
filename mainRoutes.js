const path = require('path')
const express = require('express')
const mainRouter = express.Router()

// Serve static files from the "public" directory
mainRouter.use(express.static(path.join(__dirname, 'public')));


mainRouter.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'views', 'index.html'))
})

module.exports = mainRouter