const Product = require('../../db/models/product')
const Prices = require('../../db/models/prices')

module.exports ={
    getSomeProduct: async (ctx) => {
        try{
            let res = await Product.aggregate([
               {
                    $lookup:{
                        from: "catesecondaries",
                        localField: "father",
                        foreignField: '_id',
                        as:'father'
                    },
                },
                {
                    $unwind:"$father"
                },
                {
                    $limit: 10
                },{
                    $project:{
                        "name": "$name",
                        "father": "$father"
                    }
                }

            ])
            ctx.body = res
        }catch(err){
            console.log(err)
        }
    },

    searchProduct: async (ctx) =>{
        let {word,customerId,pageNow,pageSize} = ctx.request.body
        if(!customerId){
            ctx.status = 400
            ctx.body = 'Dont have user info'
            return
        }
        try{
            let res = await Product.find({$or:[
                {"name_ch": { $regex: word, $options: 'i' } }, 
                {"name_en": { $regex: word, $options: 'i' } }
            ]}).populate({path: 'father', select: 'name_ch name_en', populate: {path: 'father', select: 'name_ch name_en', populate: {path: 'father', select: 'name_ch'}}})
            .limit(pageSize && typeof(pageSize) === 'number' && pageSize >0 && pageSize < 30? pageSize: 10)
            .skip(pageSize && typeof(pageSize) === 'number' && pageSize >0 && pageSize < 30 && pageNow && typeof(pageNow) === 'number' && pageNow >=0? pageSize * pageNow:0)
            res = res.filter(item => item.father && item.father.father && item.father.father.father)
            console.log(res)
            let array = []
            res.forEach(async (products,index) =>{
                products.specifications.forEach(async (sku,sindex) => {
                    array.push(new Promise(async resolve =>{
                            let priceRes = await Prices.findOne({sku: sku.sku,canteen: customerId})
                            if(priceRes)sku.price = priceRes.price
                            resolve(products)
                        })
                    )
                });
            })
            await Promise.all(array)
            ctx.body = res
        }catch(err){
            console.log('error')
            console.log(err)
        }
    }
}