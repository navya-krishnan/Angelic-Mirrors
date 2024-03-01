const express = require('express')
const userCollection = require('../model/mongodb')

const block = async (req, res ,next) => {
    try {
        const user = req.session.user
        const userEmail = user ? user.email : req.body.email
        const check = await userCollection.findOne({ email: userEmail })


        if (req.session.user && check && !check.block) {
            console.log("User is blocked");

            req.session.user = null
            res.status(400).render('user/userLogin')
        } else {
            next()
        }
    } catch (error) {
        console.log("Err in block");
        res.status(502).send('error');
    }
}

module.exports = {
    block
}