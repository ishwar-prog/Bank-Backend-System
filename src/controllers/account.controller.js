const accountModel = require("../models/account.model");

async function createAccountController(req, res){

    const userId = req.user;

    const account = await accountModel.create({
        user: userId
    })

    res.status(201).json({
        account
    })
}

module.exports= {
    createAccountController
}