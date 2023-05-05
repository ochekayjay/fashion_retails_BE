const connectdb = require('./db/db')
const port = process.env.PORT || 5005;
const path = require('path')
const bodyparser = require('body-parser')
const cors = require('cors')
const app = require('express')()
const authorizer = require('./server/middlewares/authorizeUser')
const creatorRoutes = require('./server/route/creatorRoutes')


app.use(cors({
    origin: '*'
  }));
  
  app.use(
      bodyparser.urlencoded({
        extended: true,
      })
    );
  
    app.use(
      bodyparser.json()
    );

    connectdb()


    app.use('/creator', creatorRoutes)

app.listen(port, ()=> console.log( 'in here'))