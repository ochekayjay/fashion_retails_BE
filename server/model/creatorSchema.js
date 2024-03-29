const mongoose = require('mongoose')

const creator = mongoose.Schema({
    Username:{
        type: String,
        required: true,
        index: true,
        unique: true
    },  
    name:{
        type: String,
        required: true
    },                                     
    Password:{
        type: String,
        required: true,
    },
    Email:{
        type: String,
        required: true,
        unique: true,
    },
    backgroundColor:{
        type: String
    },
    numberOfViews:{
        type: Number,
        default: 0,
    },
    avatarName:{
        type: String,
        default: 'dfdfdf'
    },
    verified:{
        type: Boolean,
        default: false
    },
    hashtag:{
        type: String
    },
    bio:{
        type: String,
        required: true
    },
    twitter:{
        type: String
    },
    facebook:{
        type: String
    },
    instagram:{
        type:String
    },
    socketId:{
        type:String,
        default: 'null'
    }
},{
    timestamps :true
})

creator.index([{ Username: 'text'},{bio:'text'},{name:'text'}])
module.exports = mongoose.model('Creator',creator)