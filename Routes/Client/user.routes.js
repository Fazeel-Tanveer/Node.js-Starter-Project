const express = require('express');
const checkAuth = require('../../Middleware/checkAuth.middleware');
const uploader = require('../../Middleware/uploader.middleware')
const controller = require('../../Controllers/Client/user.controllers');
const router = express.Router();

//CRUD
router.post('/create', uploader, controller.create)
router.get('/get/:_id', controller.get)
router.get('/list', controller.list)
router.delete('/delete/:_id', controller.delete)
router.put('/update', uploader, controller.update) // id required in form data

//Auth
router.get('/author', checkAuth, controller.author);
router.post('/login', uploader, controller.userLogin);

module.exports = router