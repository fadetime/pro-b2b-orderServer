const Order = require('../../db/models/order')
const Price = require('../../db/models/prices')
const Customer = require('../../db/models/customer')
const Catesecondaries = require('../../db/models/catesecondaries')
const Cateprimaries = require('../../db/models/cateprimaries')
const Supplies = require('../../db/models/supplies')
const Distribution = require('../../db/models/distribution')
const Ordercreateinfo = require('../../db/models/ordercreateinfo')
const service = require('./services')
const Staff = require('../../db/models/staffs')
const mongoose = require('mongoose')
const product = require('../../db/models/product')
const globals = require('../../db/models/globals')
const ObjectId = mongoose.Types.ObjectId
const compose = require('koa-compose')

async function resetstorage(createInfo){
    try{
        if(!createInfo || !createInfo.goods){
            return
        }
        createInfo.goods.forEach(async item =>{
            product.findById(item.product)
            .then(productInfo =>{
                productInfo.specifications.some(originProductInfo =>{
                    if(originProductInfo.sku === item.sku){
                        productInfo.stock.sale = (productInfo.stock.sale - item.quantity.order/originProductInfo.ratio).toFixed(2)
                        productInfo.save()
                        return
                    }
                })
            })
        })
    }catch(err){
        console.log('catch an error while edit storage')
        console.log(err)
    }
}

async function createOrder_changeHistory(canteen,supplies){
    try{
        let tempCustomerInfo = await Customer.findById(canteen.canteen)
        supplies.array.forEach(element =>{
            let same = false
            tempCustomerInfo.customerHistory.some( server=> {
                if(server.product == element.product){
                    same = true
                    return
                }
                return 
            })
            if(!same){
                tempCustomerInfo.customerHistory.push({
                    product: element.product,
                    sku: element.sku
                })
            }
        })
        tempCustomerInfo.save()
    }catch(err){
        console.log('catch an error while find customer history')
        console.log(err)
    }
}

async function createOrder_afterPick(ctx,supplies, createTime, canteen, change, mode, deliveryTime, ordercreateinfo,next){
    try{
        function getCode() { 
            return uuid(4) + '-' + uuid(4) + '-' + uuid(4) + '-' + uuid(4) 
        } 
        function uuid(len) { 
            let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('') 
            let uuid = [], i 
            let radix = chars.length 
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix] 
            return uuid.join('') 
        }
        let amount = 0
        let action = supplies.array.map(good =>{
            return new Promise(async (resolve,reject) =>{
                try{
                    let priceInfo = await Price.findOne({product: good.product,sku: good.sku})
                    if(priceInfo){
                        if(mode === 'free'){
                            good.price = 0
                            amount += 0
                        }else{
                            good.price = priceInfo.price
                            amount += priceInfo.price * good.quantity.order
                        }
                        resolve(priceInfo)
                    }else{
                        reject(good)
                    }
                }catch(err){
                    console.log('Catch an error while get count price')
                    console.log(err)
                    reject(good)
                }
            })
        })
        await Promise.all(action)
        let tempGst = await globals.findOne()
        if(!tempGst)tempGst.delivery.tax = 7
        let createDate = {
            number: getCode(),
            createTime: createTime,
            canteen: canteen,
            ordercreateinfo: ordercreateinfo._id,
            status: 'waiting', 
            amount: (Math.round(amount*100)/100).toFixed(2),
            goods: supplies.array,
            supplyTag: supplies.suppliesId,
            deliveryTime: deliveryTime,
            GST: tempGst.delivery.tax,
            totalPrice: (Math.round((amount + amount*tempGst.delivery.tax/100)*100)/100).toFixed(2)
        }
        let createInfo = await Order.create(createDate)
        if(createInfo){
            console.log('enter if')
            ctx.body = 'Create done'
            ctx.status = 200
        }else{
            console.log('enter else')
            context.ctx.body = 'Something wrong'
        }
        createOrder_changeHistory(canteen, supplies)
        resetstorage(createInfo)
    }catch(err){
        console.log('find some error')
        ctx.body = err
        ctx.status = 401
        console.log(err)
    }
}

async function checkStorage(context,next){
    console.log('check store')
    if(context.goods.length === 0){
        let err = new Error('Goods list cant be empty')
        err.code = 403
        throw err
    }
    let action = context.goods.map(good =>{
        return new Promise(async (resolve,reject) =>{
            let goodInfo = await product.findOne({_id: good.product})
            if(!goodInfo)return reject({good: good,msg:'Product not found',code: 403})
            let [sku] = goodInfo.specifications.filter(spec => good.sku === spec.sku)
            if(goodInfo.stock.sale<=0 || goodInfo.stock.sale * sku.ratio < good.quantity.order)return reject({good: good,msg:'Product out of stock',code: 401})
            resolve(goodInfo)
        })
    })
    try{
        await Promise.all(action)
        await next()
    }catch(error){
        if(context.needUpdateInfo && context.needUpdateInfo.length != 0){
            let action = context.needUpdateInfo.map(item =>{
                return new Promise(async resolve =>{
                    let orderInfo = await Order.findOneAndUpdate({_id: item},{status: 'waiting'})
                    resolve(orderInfo)
                })
            })
            await Promise.all(action)
        }
        let err = new Error(error.msg)
        err.etc = error.good
        err.code = error.code
        throw err
    }
}
async function orderLogCreate(context,next){
    let {orderer, createTime, canteen, goods, change, mode, deliveryTime} = context
    let tempArray = []
    // 配单记录
    let ordercreateinfo = await Ordercreateinfo.create({
        orderer: orderer,
        createDate: createTime,
        deliveryTime: deliveryTime,
        canteen: canteen,
        goods: goods
    })
    goods.forEach(originGoods =>{
        if(tempArray.length === 0){
            tempArray.push({
                suppliesId: originGoods.supplies.suppliesId,
                array: [originGoods]
            })
        }else{
            let same = false
            tempArray.some(array =>{
                if(array.suppliesId === originGoods.supplies.suppliesId){
                    array.array.push(originGoods)
                    same = true
                    return
                }
            })
            if(!same){
                tempArray.push({
                    suppliesId: originGoods.supplies.suppliesId,
                    array: [originGoods]
                })
            }
        }
    })
    let action = tempArray.map(element =>{
        return new Promise(async resolve =>{
            await createOrder_afterPick(context.ctx,element, createTime, canteen, change, mode, deliveryTime, ordercreateinfo,next)
            resolve(true)
        })
    })
    await Promise.all(action)
    await next()
}
async function returnStorage(context,next){
    try{
        if(context.isNeedUpdateOrder){
            console.log('needUpdateInfo')
            console.log(context.needUpdateInfo)
            let orderAction = context.needUpdateInfo.map(item =>{
                return new Promise(async (resolve,reject) =>{
                    let orderInfo = await Order.findById(item)
                    if(orderInfo.status != 'waiting'){
                        let err = `Order status error,it must be waiting.Order-number: ${orderInfo.number},Order-status: ${orderInfo.status}`
                        reject({orderInfo: orderInfo.number,msg:err,code: 501})
                    }
                    if(orderInfo.goods.length === 0){
                        let err = `Order goods list is none`
                        reject({msg: err,code: 501})
                    }
                    resolve(orderInfo)
                })
            })
            let orderArray = await Promise.all(orderAction)
            let actions = orderArray.map(order =>{
                return new Promise(async (resolve,reject) =>{
                    order.goods.forEach(async good =>{
                        let productInfo =  await product.findById(good.product)
                        let [sku] = productInfo.specifications.filter(spec => good.sku === spec.sku)
                        productInfo.stock.sale = (productInfo.stock.sale + good.quantity.order/sku.ratio).toFixed(2)
                        await productInfo.save()
                    })
                    let saveInfo = await Order.findOneAndUpdate({_id: order._id},{status: 'cancelled'})
                    console.log('saveInfo')
                    console.log(saveInfo)
                    resolve(saveInfo)
                })
            })
            console.log('actions')
            console.log(actions)
            await Promise.all(actions)
        }
        await next()
    }catch(error){
        console.log(error)
        let err = new Error(error.msg)
        err.etc = error.good || null
        err.code = error.code || null
        throw err
    }
}
module.exports ={
    createOrder: async (ctx, next) => {
        let {orderer, createTime, canteen, goods, change, mode, deliveryTime} = ctx.request.body
        let context = {
            orderer: orderer,
            createTime: createTime, 
            canteen: canteen, 
            goods: goods, 
            change: change, 
            mode: mode, 
            deliveryTime: deliveryTime,
            ctx: ctx,
            isNeedUpdateOrder: ctx.request.body.isNeedUpdateOrder,
            needUpdateInfo: ctx.request.body.needUpdateInfo
        }
        return compose([returnStorage,checkStorage,orderLogCreate])(context)
    },

    lastOrder: async (ctx) =>{
        try{
            let customerId = ctx.query.customerId
            console.log(customerId)
            let orderInfo = await Ordercreateinfo.findOne({"canteen.canteen": customerId}).sort({createDate: -1}).populate({path: 'goods',populate: {path: 'product'}})
            console.log(orderInfo)
            if(!orderInfo || orderInfo.goods.length === 0){
                err.code = 404
                throw err
            }else{
                ctx.body = orderInfo.goods
            }
        }catch(err){
            console.log('catch an error while find last order')
            console.log(err)
        }
    },

    getWaitingOrder: async (ctx) =>{
        try{
            // let customerId = ctx.query.customerId
            let orderInfo = await Order.find({status: 'waiting'},{status: 1,createTime: 1,canteen: 1, goods: 1}).sort({createTime: -1}).limit(5)
            .populate({path: 'canteen', select: 'name_ch name_en'})
            .populate({path: 'goods',populate: {path: 'product', populate: {path: 'father', populate: {path: 'father', populate: {path: 'father'}}}}})
            console.log(orderInfo)
            if(orderInfo.length === 0){
                err.code = 404
                throw err
            }else{
                ctx.body = orderInfo
            }
        }catch(err){
            console.log('catch an error while find last order')
            console.log(err)
        }
    },

    getOrderDetail: async (ctx) =>{
        try{
            let {orderId} = ctx.request.body
            let orderInfo = await Order.findById(orderId)
            .populate({path: 'canteen.canteen'})
            .populate({path: 'distribution'})
            .populate({path: 'goods',populate: {path: 'product', populate: {path: 'father', populate: {path: 'father', populate: {path: 'father'}}}}})
            console.log(orderInfo)
            if(orderInfo.length === 0){
                err.code = 404
                throw err
            }else{
                ctx.body = orderInfo
            }
        }catch(err){
            console.log('catch an error while find last order')
            console.log(err)
        }
    },

    getOrderArray: async (ctx) =>{
        let {supplyTag, staffId} = ctx.query
        let startDate = new Date().toDateString()
        let tempDate = new Date(startDate).getDate()
        let endDate = new Date(startDate).setDate(tempDate + 1)
        startDate = new Date(startDate).toISOString()
        endDate = new Date(endDate).toISOString()
        try{
            let vipArray = await Order.aggregate([
                {
                    $match: {status : "waiting", supplyTag: ObjectId(supplyTag),deliveryTime: {$gte: new Date(startDate), $lte: new Date(endDate)}}
                },{
                    $project:{
                        canteen: 1,
                        deliveryTime: 1,
                        length: {$size: '$goods'}
                    }
                },
                {
                    $sort: {deliveryTime: 1, length: -1}
                },
                {
                    $limit: 3
                },
                {
                    $lookup:{
                        from: "canteens",
                        localField: "canteen.canteen",
                        foreignField: '_id',
                        as:'canteens'
                    },
                },
                {
                    $unwind:"$canteens"
                },
                {
                    $match: {'canteens.distributers': ObjectId(staffId)}
                },
                {
                    $project:{
                        canteens: "$canteens.distributers",
                        deliveryTime:"$deliveryTime",
                    }
                }
            ])
            if(vipArray.length <3){
                let tempArray = vipArray.map(item =>{
                    return item._id
                })
                let orderArray = await Order.aggregate([
                    {
                        $match: {_id: {$nin: tempArray}, status : "waiting", supplyTag: ObjectId(supplyTag),deliveryTime: {$gte: new Date(startDate), $lte: new Date(endDate)}}
                    },{
                        $lookup:{
                            from: "canteens",
                            localField: "canteen.canteen",
                            foreignField: '_id',
                            as:'canteens'
                        },
                    },{
                        $unwind:"$canteens"
                    },
                    {
                        $lookup: {
                            from: 'staffs',
                            let: { order_canteens:"$canteens.distributers", order_supplyTag: "$supplyTag"},
                            pipeline:[
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                {$eq: ["$supplyTag", "$$order_supplyTag" ]},
                                                {$eq: ["$workStatus","active"]},
                                                {$in: ["$_id","$$order_canteens"]}
                                            ]
                                        }
                                    }
                                    
                                }
                            ],
                            as: 'staffs'
                        }
                    },
                    {   
                        $match: {'staffs': {$size: 0}}
                    },
                    {
                        $project:{
                            canteen: 1,
                            deliveryTime: 1,
                            staffs: 1,
                            length: {$size: '$goods'}
                        }
                    },
                    {
                        $sort: {deliveryTime: 1, length: -1}
                    },{
                        $limit: 3 - vipArray.length
                    },
                    {
                        $project:{
                            canteens: "$canteens.distributers",
                            deliveryTime: "$deliveryTime",
                            staffs: "$staffs",
                            supplyTag: "$supplyTag"
                        }
                    }
                ])
                if(orderArray.length>0)vipArray = vipArray.concat(orderArray)
            }
            if(vipArray.length === 0){
                ctx.status = 404
                ctx.body = 'Order not found'
            }else{
                ctx.body = vipArray
            }
        }catch(err){
            console.log('catch an error while find last order')
            console.log(err)
        }
    },

    finishOrder: async (ctx,next) =>{
        try{
            let {orderInfo, distributer, endDate} = ctx.request.body
            let order = await Order.findById(orderInfo._id).populate({path: 'canteen.canteen'})
            let nextPayDate = await service.nextPayDate(order.canteen.canteen.agreeDate, order.canteen.canteen.payPeriod, endDate)
            let distributionInfo = await Distribution.findOneAndUpdate({_id: order.distribution},{endTime: endDate,goods: orderInfo.goods},{new: true})
            let allFinish = true
            let tempAmount = 0
            orderInfo.goods.forEach(element => {
                order.goods.some(item =>{
                    if(element._id == item._id){
                        if(!element.quantity.real) {
                            allFinish = false
                            return
                        }
                        let productInfo = await product.findOne(item._id)
                        productInfo.stock.real = (productInfo.stock.real - item.quantity.order/originProductInfo.ratio).toFixed(2)
                        item.quantity.real = element.quantity.real
                        if(element.remark)item.remark = element.remark
                        tempAmount += item.quantity.real * item.price
                        return
                    }
                })
            });
            let tempGst = await globals.findOne()
            if(!tempGst)tempGst.delivery.tax = 7
            if(allFinish)order.status = 'distributed'
            if(order){
                let invNum = await service.createInvoiceNum(distributer)
                order.invoice = invNum
                order.amount = (Math.round(tempAmount*100)/100).toFixed(2)
                order.GST = tempGst.delivery.tax
                order.nextPayDate = nextPayDate,
                order.invoiceTime = endDate,
                order.totalPrice = (Math.round((tempAmount + tempAmount * tempGst.delivery.tax/100)*100)/100).toFixed(2)
                let saveOrder = await order.save()
                ctx.body = saveOrder
            }else{
                let err = new Error('Something wrong while order update')
                err.code = 404
                throw err
            }
        }catch(err){
            console.log('catch an error while find last order')
            console.log(err)
        }
    },

    changeOrderStatus: async (ctx) =>{
        try{
            let { orderId ,startTime, staffId} = ctx.request.body
            let orderInfo = await Order.findOneAndUpdate({_id: orderId, status:'waiting'},{
                status: 'distributing'
            },{new: true})
            console.log(orderInfo)
            if(orderInfo){
                if(!orderInfo.distribution){
                    let distributionInfo = await Distribution.create({
                        order: orderInfo._id,
                        startTime: startTime,
                        distributer: staffId
                    })
                    let secondUpdate = await Order.findOneAndUpdate({_id: orderId},{ distribution: distributionInfo._id },{new: true})
                    console.log(secondUpdate)
                }
                ctx.body = 'done'
            }else{
                ctx.status = 402
                ctx.body = 'Information has expired'
            }
        }catch(err){
            console.log('catch an error while chagne order status to distributing')
            console.log(err)
        }
    },

    getProcessingOrder: async (ctx) =>{
        let {staffId} = ctx.query
        console.log(staffId)
        let today = new Date().toDateString()
        today = new Date(today).getTime()
        let yestoday = new Date(today - (1000 * 60 * 60 * 24)).toISOString()
        let tomorrow = new Date(today + (1000 * 60 * 60 * 24)).toISOString()
        try{
            let processingOrder = await Order.aggregate([
                {
                    $match: {status : "distributing", deliveryTime:{$gte: new Date(yestoday), $lte: new Date(tomorrow)}}
                },{
                    $lookup:{
                        from: "distributions",
                        localField: "distribution",
                        foreignField: '_id',
                        as:'distribution'
                    },
                },{
                    $unwind:"$distribution"
                },{
                    $match: {'distribution.distributer': ObjectId(staffId)}
                },
                {
                    $lookup:{
                        from: "canteens",
                        localField: "canteen.canteen",
                        foreignField: '_id',
                        as:'canteens'
                    }
                },{
                    $unwind:"$canteens"
                }
            ])
            ctx.body = processingOrder
        }catch(err){
            console.log('catch an error while chagne order status to distributing')
            console.log(err)
        }
    },

    getFinishOrder: async (ctx) => {
        let {staffId} = ctx.query
        let today = new Date().toDateString()
        today = new Date(today).getTime()
        let yestoday = new Date(today - (1000 * 60 * 60 * 24)).toISOString()
        let tomorrow = new Date(today + (1000 * 60 * 60 * 24)).toISOString()
        try{
            let finishOrder = await Order.aggregate([
                {
                    $match: {status : "distributed", deliveryTime:{$gte: new Date(yestoday), $lte: new Date(tomorrow)}}
                },{
                    $lookup:{
                        from: "distributions",
                        localField: "distribution",
                        foreignField: '_id',
                        as:'distribution'
                    },
                },{
                    $unwind:"$distribution"
                },{
                    $match: {'distribution.distributer': ObjectId(staffId)}
                },{
                    $sort: {'distribution.endTime': -1}
                }
            ])
            ctx.body = finishOrder
        }catch(err){
            console.log('catch an error while chagne order status to distributed')
            console.log(err)
        }
    }
}