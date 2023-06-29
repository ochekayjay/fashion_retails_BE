
const {createNotification,getNotification} = require('../controller/notificationController')
const router = require('express').Router()
const authorizer = require('../middlewares/authorizeUser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')






router.post('/project',authorizer,createNotification)
router.get('/project/:id',authorizer,getNotification)

module.exports = router