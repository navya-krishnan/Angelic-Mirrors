const { isAdmin } = require('../../middleware/admin');
const userDatabase = require('../../model/user')

//get user
const getUserManage = async (req, res) => {
    try {
        if (isAdmin) {
            const page = parseInt(req.query.page) || 1;
            const perPage = 6;

            const users = await userDatabase.find()

            const totalPages = Math.ceil(users.length / perPage);

            const startIndex = (page - 1) * perPage;
            const endIndex = Math.min(startIndex + perPage, users.length);
            const currentUsers = users.slice(startIndex, endIndex);

            const sortOption = req.query.sortOption || null;
            const user = req.query.user || null;
            const search = req.query.search || null;

            res.render('admin/userManagement', { 
                users : currentUsers,
                page,
                totalPages,
                sortOption,
                user,
                search
            })

        } else {
            res.redirect('/admin')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");
    }
}

//block user
const getBlockUser = async (req, res) => {
    try {
        const users = await userDatabase.findOne({ email: req.query.email })
        const blocked = users.block;
        if (blocked) {
            await userDatabase.updateOne(
                { email: req.query.email },
                { $set: { block: false } }
            )
        } else {
            await userDatabase.updateOne(
                { email: req.query.email },
                { $set: { block: true } }
            )
        }
        res.redirect('/admin/userManagement')
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred");

    }
}

module.exports = {
    getUserManage,
    getBlockUser
}