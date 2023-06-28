const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const errorClass = require('./errorControl')
const notificationSchema = require('../model/notificationSchema')
const nodemailer = require('nodemailer')
const multer = require('multer')
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require('crypto')


const dotenv = require('dotenv')



dotenv.config()

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.BUCKET_ACCESS_KEY
const secretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY


const s3 = new S3Client({
  credentials:{
    accessKeyId:accessKey,
    secretAccessKey:secretAccessKey
  },
  region: bucketRegion
})



let followersArray = {onlineTagged:[],offlineTagged:[]}

const createNotification = async(req,res,next)=>{
    try{
        const {notifiedSockets,link,notified} = req.body

        let newNotif = notificationSchema.create({
            notifier: req.user.id,
            link: link,
            notified: notified,
            notifiedSockets:notifiedSockets,
        })

        const foundSockets = [...notifiedSockets]
        for(let i=0; i<foundSockets.length;i++){

            const a  = global.io.sockets.adapter.sids 

            const allSocketIds = [...a.keys()]

            if(allSocketIds.includes(foundSockets[i])){
                followersArray.onlineTagged.push(foundSockets[i])
            }
            else{
               /**
                *  followersArray.offlineTagged.push(notified[i])
                console.log('trying nots out')
                const nots = await notificationSchema.create({
                    userId: foundUsers[i]['_id'],
                    postId : post.id
                })
                */        
            }
        }
        followersArray.onlineTagged.forEach(tag=>global.io.to(tag).emit('notifications',newNotif))

        res.json({status:true})
                
    }

    catch(error){
        console.log(error)
    }
}


module.exports = {createNotification}