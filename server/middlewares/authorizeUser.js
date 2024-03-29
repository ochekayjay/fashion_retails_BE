const jwt = require('jsonwebtoken')
const creatorSchema = require('../model/creatorSchema')
const errorClass = require('../controller/errorControl')

const protect = async(req,res,next)=>{
    let token;
    try{
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
       
            console.log('trying stuff')
            // Get token from header
            token = req.headers.authorization.split(' ')[1]

            //verify token
            const decoded = jwt.verify(token,'abc123')

            //get user from the token
            req.user = await creatorSchema.findById(decoded.id).select('-Password') 
            console.log(req.user.id)
            next()
        } 
        else{
            throw new errorClass('User token not found', 500)
        }}
        catch(error){
            console.log('error found')
            next(error)
        }  
}
module.exports = protect