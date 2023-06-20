const mongoose = require('mongoose')

const promos = mongoose.Schema({
    creator:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required:true,
    },
    title:{
        type: String
    },
    backgroundColor:{
        type: String
    },
    promoDescription:{
        type: String
    },
    imageName:{
        type: String,
    },
    link:{
        type: String,
    }
  
},{
    timestamps :true
})


//content.index([{ Username: 'text'},{bio:'text'},{name:'text'}])
module.exports = mongoose.model('Promos',promos)