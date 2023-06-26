const connectdb = require('./db/db')
const port = process.env.PORT || 5005;
const path = require('path')
const http = require('http')
const bodyparser = require('body-parser')
const cors = require('cors')
const app = require('express')()
const socketio = require('socket.io')
const authorizer = require('./server/middlewares/authorizeUser')
const creatorRoutes = require('./server/route/creatorRoutes')
const contentRoutes = require('./server/route/contentRoutes')
const promoRoutes = require('./server/route/promoRoutes')
const socketClass = require('./server/utils/socketclass')


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

    const server = http.createServer(app)

global.io = socketio(server);
global.io.on('connection', socketClass.connection)

global.io.on('connection', async(connect)=>{
  //console.log(Object.keys(global.io.sockets.sockets))
    console.log(`you are welcome ${connect.id} again`)
    global.io.to(connect.id).emit('secondInfo',`${connect.id} just came online for second emit`)
})



  server.listen(port)

//app.listen(port, ()=> console.log( `in ${port}`))