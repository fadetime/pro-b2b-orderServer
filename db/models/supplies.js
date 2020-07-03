const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const suppliesSchema = mongoose.Schema({
    name_ch: String,
    children: [
        {type: ObjectId, ref: 'cateprimaries'}
    ],
    nextInvSeqNumber: {type: Number, default: 0}
})

module.exports = mongoose.model('supplies', suppliesSchema)