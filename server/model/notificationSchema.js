const mongoose = require('mongoose')

const notification = mongoose.Schema({
    notifier:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator',
        required:true,
        },
        notified:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Creator',
            required:true,
            }],         
            link:{
                type: String
            },
            imageName:{
                type: String
            }
},{
    timestamps :true
})


module.exports = mongoose.model('Notification',notification)