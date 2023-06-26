const creatorSchema = require('../model/creatorSchema')
const jwt = require('jsonwebtoken')
class socketClass {
    Socketarray = []
  userIdentity = ''
    connection(client) {
      // event fired after user signs in succesfully
      client.on("addSocketid", async function(token){
        console.log('inside socket')
     
        const a  = global.io.sockets.adapter.sids 
        try{
          const decoded = jwt.verify(token,'abc123')
          console.log(client.id)
          //get user from the token
          //user = await User.findById(decoded.id).select('-Password') 
           const userData = await creatorSchema.findByIdAndUpdate(decoded.id,{
            $set:{socketId:client.id}
          },{upsert:true,new:true})

          console.log(userData)
          //this.userIdentity = userId
          
        }
        catch(error){
          console.log(error)
        }
        
        
      });

    }}

    module.exports =  new socketClass();