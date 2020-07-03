const Customer = require('../../db/models/customer')
const Ordercreateinfo = require('../../db/models/ordercreateinfo')
const Order = require('../../db/models/order')

module.exports = {
    findCustomerInfo: async (context,next) => {
        let res = await Customer.findById(context.customerId)
        .populate({path: 'customerHistory',populate: {path: 'product', populate: {path: 'father', select: 'name_ch name_en', populate: {path: 'father', select: 'name_ch name_en', populate: {path: 'father', select: 'name_ch'}}}}})
        .populate({path: 'favorites',populate: {path: 'product', populate: {path: 'father', select: 'name_ch name_en', populate: {path: 'father', select: 'name_ch name_en', populate: {path: 'father', select: 'name_ch'}}}}})
        if(!res){
            let err = new Error('Customer history not found')
            err.code = 404
            throw err
        }
        let tempHistoryInfo = []
        if(res.customerHistory && res.customerHistory.length != 0){
            tempHistoryInfo = res.customerHistory
        }else{
            tempHistoryInfo = res.favorites
        }
        tempHistoryInfo = tempHistoryInfo.filter(item => item.product && item.product.father && item.product.father.father && item.product.father.father.father && item.product.father.father.father._id)
        // context.ctx.body = {
        //     customerInfo: {
        //         name_ch: res.name_ch,
        //         name_en: res.name_en,
        //         address: res.address,
        //         invoiceAddress: res.invoiceAddress,
        //         postcode: res.postcode
        //     },
        //     customerHistory: tempHistoryInfo
        // }
        context.customerInfo = res
        context.historyInfo = tempHistoryInfo
        await next()
    },

    ifTodayHaveOrder: async (context,next) =>{
        let tempDate = new Date(context.today).getDate()
        let startDate = new Date(context.today).toDateString()
        let endDate = new Date(startDate)
        startDate = new Date(context.today).setDate(tempDate -1)
        startDate = new Date(startDate).toISOString()
        endDate = new Date(endDate).toISOString()
        let createInfo = await Ordercreateinfo.findOne({"canteen.canteen": context.customerId,deliveryTime: {$gt: new Date(startDate), $lte: new Date(endDate)}})
        .populate({path: 'goods',populate: {path: 'product'}})
        .sort({_id: -1})
        console.log(createInfo)
        let todayOrderInfo =[]
        if(createInfo){
            let orderInfo = await Order.find({ordercreateinfo: createInfo._id ,status: { $ne: 'cancelled'}}).populate({path: 'supplyTag',select: {'name_ch': 1}})
            if(orderInfo.length != 0){
                let isAllWaiting =true
                todayOrderInfo = orderInfo.map(item =>{
                    if(item.status != 'waiting')isAllWaiting = false
                    return {
                        status: item.status,
                        deliveryTime: item.deliveryTime,
                        supplyTag: item.supplyTag,
                        number: item.number,
                        goods: item.goods,
                        orderId: item._id
                    }
                })
                context.isAllWaiting = isAllWaiting
            }
            context.todayOrderInfo = todayOrderInfo
        }
        await next()
    },

    res: async (context,next) =>{
        context.ctx.body = {
            customerInfo: {
                name_ch: context.customerInfo.name_ch,
                name_en: context.customerInfo.name_en,
                address: context.customerInfo.address,
                invoiceAddress: context.customerInfo.invoiceAddress,
                postcode: context.customerInfo.postcode
            },
            customerHistory: context.historyInfo,
            todayOrderInfo: context.todayOrderInfo,
            isAllWaiting: context.isAllWaiting
        }
        await next()
    }
}
