const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const cateprimariesSchema = mongoose.Schema({
    name_ch: String,
    name_en: String,
    children: [ 
        {type: ObjectId, ref: 'catesecondaries'}
    ],
    cover: String,
    father: {type: ObjectId, ref: 'supplies'}
})

module.exports = mongoose.model('cateprimaries', cateprimariesSchema)