const connectdb = require('./db/db')
const port = process.env.PORT || 5005;
const path = require('path')
const bodyparser = require('body-parser')
const cors = require('cors')
const app = require('express')()
const authorizer = require('./server/middlewares/authorizeUser')
const creatorRoutes = require('./server/route/creatorRoutes')
const contentRoutes = require('./server/route/contentRoutes')
const promoRoutes = require('./server/route/promoRoutes')


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
    app.use('/content', contentRoutes)
    app.use('/promo',promoRoutes)

app.listen(port, ()=> console.log( `in ${port}`))