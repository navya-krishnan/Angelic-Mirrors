const mongoose = require("mongoose")

const angelicMirrorSchema = new mongoose.Schema({
    username : {
        type : String,
    },
    password :{
        type : String,
        required : true,
    },
    email :{
        type : String,
        required : true,
    },
    couponApplied: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "coupondb"
    }],
    block :{
        type : Boolean,
        default : true
    }
})

// declaring the collection name
const angelicMirror = new mongoose.model("users",angelicMirrorSchema)

// exporting the module
module.exports = angelicMirror