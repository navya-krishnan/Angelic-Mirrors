const express = require('express')
const userCollection = require('../model/user')

const block = async (req, res, next) => {
    try {
        const user = req.session.user;
        const userEmail = user ? user.email : req.body.email;
        const check = await userCollection.findOne({ email: userEmail });

        if (req.session.user && check && !check.block) {
            const errorMessage = req.flash("error")[0];
            req.session.user = null;
            return res.status(400).render('user/userLogin', { errorMessage });
        } else {
            next();
        }
    } catch (error) {
        console.log("Error in block middleware:", error);
        return res.status(502).send('Error occurred');
    }
}

module.exports = {
    block
}
