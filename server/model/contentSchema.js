const mongoose = require('mongoose')

const content = mongoose.Schema({
    creator:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required:true,
    },
    imageName:{
        type: String
    },
    backgroundColor:{
        type: String
    },
    hashtag:{
        type: String
    },
    title:{
        type: String
    },
    projectDescription:{
        type: String
    },
    itemsArray:[
        {
            Email:{
                type: String,
            
            },
            itemName:{
                type: String,
            },
            companyName:{
                type: String,
            },
            itemNumber:{
                type: Number,
            },
            Phone:{
                type: Number,
            },
            verified:{
                type: Boolean,
                default: false
            },
            Delivery:{
                type: String,
            
            },
            distance:{
                type : Object
            }
        }
    ],
  
},{
    timestamps :true
})

//content.index([{ Username: 'text'},{bio:'text'},{name:'text'}])
module.exports = mongoose.model('Content',content)