const mongoose = require('mongoose');

const connectdb = async()=>{
    try{
      /**
       *   const connectionParams = {
            useNewUrlParser:true,
            useCreateIndex:true,
            useUnifiedTopology:true
        }
       */
        const conn = await mongoose.connect('mongodb+srv://igoche:Dc777jjj@fashionretail01.smuome4.mongodb.net/test')

        console.log(`mongodb is connected: ${conn.connection.host}`)
    }
    catch(error){
         console.log(error)
         process.exit(1)
    }
}

module.exports = connectdb