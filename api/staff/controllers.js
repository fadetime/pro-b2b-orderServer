const Staff = require('../../db/models/staffs')
const CryptoJS = require('crypto-js')
const {passwordKey} = require('../../config/index')()

module.exports ={
    changePassword: async (ctx) => {
        let {userId, oldPassword, newPassword} = ctx.request.body
        try{
            let res = await Staff.findById(userId)
            if(res.workStatus != 'active'){
                let error = new Error('This account has been frozen')
                ctx.body = 'This account has been frozen'
                ctx.status = 403
                throw error
            }
            let hash = await CryptoJS.HmacSHA256(oldPassword, passwordKey)
            if(hash != res.password){
                let error = new Error('wrong password')
                ctx.body = 'wrong password'
                ctx.status = 400
                throw error
            }
            let newHash = await CryptoJS.HmacSHA256(newPassword, passwordKey)
            res.password = newHash
            let newRes = await res.save()
            if(newRes){
                ctx.body = newRes
            }else{
                let error = new Error('Catch an error while save new password')
                ctx.body = 'Catch an error while save new password'
                ctx.status = 402
                throw error
            }
        }catch(err){
            console.log(err)
        }
    }
}