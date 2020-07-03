const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const orderSchema = mongoose.Schema({
    number: String,//订单编号
    createTime: { type: Date, default: Date.now },
    canteen: {
        canteen: {type: ObjectId, ref: 'canteens'},
        name_ch: String,
        name_en: String,
        address: String,
        invoiceAddress: String,
        postcode: String
    },
    distribution: {type: ObjectId, ref: 'distribution'}, //配单信息表
    ordercreateinfo: {type: ObjectId, ref: 'ordercreateinfo'},//下单信息表
    status:{ type: String, default: 'waiting'}, 
    financialStatus: { type: String, default: 'notReceived'},
    invoice: String, // 发票号
    amount: Number,
    remark:{
        company: String,
        customer: String,
    },
    supplyTag: {type: ObjectId, ref: 'supplies'},
    deliveryTime: Date,
    goods:[{
        product: {type: ObjectId, ref: 'products'},
        cprice: Number,//原价
        price: Number,//购买价格
        name_ch: String,
        name_en: String,
        remark: String,
        sku: String,
        quantity: {
            real:   Number, // 配单量
            order: Number // 订单量
        }
    }],
    GST: Number,
    totalPrice: Number,
    nextPayDate: String,
    invoiceTime: Date,
    reasion: String //删除订单原因
})

module.exports = mongoose.model('order', orderSchema)