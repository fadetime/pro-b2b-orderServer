const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const productSchema = mongoose.Schema({
    name_ch: String,
    name_en: String,
    specifications: [ 
        {
            spec_ch: String,
            spec_en: String,
            cprice: Number,
            oprice: Number,
            limit: Number,
            ratio: Number,
            sku: String,
            price: Number,
            ifFloat: Boolean,
        }
    ],
    stock: {
        sale: Number,
        real: Number
    },
    father: {type: ObjectId, ref: 'catesecondaries'}
})

module.exports = mongoose.model('products', productSchema)