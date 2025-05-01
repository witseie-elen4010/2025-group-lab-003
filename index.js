const path = require('path')
 // used later in the exercise
 const express = require('express')
 const app = express()
 const mainRouter = require('./mainRoutes')

 app.use(mainRouter)
 
 app.listen(3000)
 console.log('Express server running on port 3000')