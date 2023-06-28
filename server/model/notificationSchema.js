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
            creatorNotification: [{
                type: String
            }],        
            link:{
                type: String
            },
},{
    timestamps :true
})


module.exports = mongoose.model('Notification',notification)