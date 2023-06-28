const mongoose = require('mongoose')

const notification = mongoose.Schema({
    notifier:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator',
        required:true,
        },
    notifiedArray:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Creator',
            required:true,
            }], 
                                        
    projectUrl:{
                type: String
            },
},{
    timestamps :true
})


module.exports = mongoose.model('Notification',notification)