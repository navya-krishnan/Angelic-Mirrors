const userDatabase = require('../../model/user')
const addressDatabase = require('../../model/address')

//get method for profile
const getProfile = async (req, res) => {
    try {
        if (req.session.user) {
            const userDetails = req.session.user
            const userId = req.session.user._id
            const email = userDetails.email
            let user = await userDatabase.findOne({ email: email })

            const addresses = await addressDatabase.find({ userId: userId })

            if (addresses.length === 0) {
                console.log("No addresses found for the user.");
                res.render('user/profile/profile', { user, addresses: [] });
            } else {
                // Render the user profile page with the addresses
                res.render('user/profile/profile', { user, addresses });
            }

        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering add address page");
    }
}

//to get the address
const getAddAddress = async (req, res) => {
    try {
        if (req.session.user) {
            res.render('user/profile/addAddress')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering add address page");
    }
}

const postAddAddress = async (req, res) => {
    try {
        if (req.session.user) {
            const userDetails = req.session.user
            const email = userDetails.email
            let user = await userDatabase.findOne({ email: email })
            const userId = user._id

            const address = {
                userId: userId,
                name: req.body.username,
                address: req.body.address,
                street: req.body.street,
                city: req.body.city,
                district: req.body.district,
                state: req.body.state,
                country: req.body.country,
                pincode: req.body.pincode,
                phone: req.body.phone
            }

            await addressDatabase.insertMany(address)
            res.redirect('/profile')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering post add address page");
    }
}

//to get the edit profile
const getEditProfile = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.params.id
            const user = await userDatabase.findById(userId)

            res.render('user/profile/editProfile', { user })
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering get edit profile");
    }
}

const postEditProfile = async (req, res) => {
    try {
        const userId = req.params.id

        const edited = await userDatabase.findByIdAndUpdate(userId, {
            username: req.body.username,
            email: req.body.email
        })
        console.log(edited, "edit profile");

        res.redirect('/profile')
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering post edit profile");
    }
}

//edit address
const getEditAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId
        const address = await addressDatabase.findById(addressId)
        console.log(address, "address");

        res.render('user/profile/editAddress', { address });
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering get edit address");
    }
}


const postEditAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId
        const { name, address, street, city, district, state, country, pincode, phone } = req.body

        const secaddress = await addressDatabase.findByIdAndUpdate(addressId, {
            name: name,
            address: address,
            street: street,
            city: city,
            district: district,
            state: state,
            country: country,
            pincode: pincode,
            phone: phone
        })

        res.redirect('/profile')
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering post edit address");
    }
}

//to delete address
const getDeleteAddress = async (req, res) => {
    try {
        if (req.session.user) {
            const addressId = req.params.addressId

            const user = await userDatabase.findOne({ _id: req.session.user._id })

            await addressDatabase.findByIdAndDelete(addressId)

            res.redirect('/profile')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while rendering get delete address");
    }
}


module.exports = {
    getProfile,
    getAddAddress,
    postAddAddress,
    getEditProfile,
    postEditProfile,
    getEditAddress,
    postEditAddress,
    getDeleteAddress
}