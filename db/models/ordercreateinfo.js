const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const ordercreateinfoSchema = mongoose.Schema({
    orderer: ObjectId,
    createDate: Date,
    deliveryTime: Date,
    canteen: {
        canteen: {type: ObjectId, ref: 'canteens'},
        name_ch: String,
        name_en: String,
        address: String,
        invoiceAddress: String,
        postcode: String
    },
    goods:[{
        product: {type: ObjectId, ref: 'products'},
        cprice: Number,//原价
        price: Number,//购买价格
        name_ch: String,
        name_en: String,
        sku: String,
        quantity: {
            real:   Number, // 配单量
            order: Number // 订单量
        }
    }]
})

module.exports = mongoose.model('ordercreateinfo', ordercreateinfoSchema)