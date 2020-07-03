const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const catesecondariesSchema = mongoose.Schema({
    name_ch: String,
    name_en: String,
    children: [ 
        {type: ObjectId, ref: 'products'}
    ],
    cover: String,
    father: {type: ObjectId, ref: 'cateprimaries'}
})

module.exports = mongoose.model('catesecondaries', catesecondariesSchema)