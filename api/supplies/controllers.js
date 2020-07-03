const Supplies = require('../../db/models/supplies')

module.exports ={
    getSupplies: async (ctx) => {
        try{
            let res = await Supplies.find({},{name_ch: 1})
            ctx.body = res
        }catch(err){
            console.log(err)
        }
    },
}