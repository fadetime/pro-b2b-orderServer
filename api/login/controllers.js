const jwt = require('jsonwebtoken')
const {key,expiresIn,passwordKey} = require('../../config/index')()
const CryptoJS = require('crypto-js')
const Staff = require('../../db/models/staffs')
const Roles = require('../../db/models/roles')

module.exports ={
    loginMethod: async (ctx) => {
        let {userName,password} = ctx.request.body
        let hash = await CryptoJS.HmacSHA256(password, passwordKey)
        let staffInfo = await Staff.findOne({username: userName}).populate({path: 'role'})
        console.log(staffInfo)
        if(!staffInfo){
            let err = new Error('Login error:Wrong username or password')
            err.code = 401
            throw err
        }
        if(staffInfo.workStatus === 'notActive'){
            let err = new Error('Login error:This user is not active')
            err.code = 403
            throw err
        }
        if(hash != staffInfo.password){
            let err = new Error('Login error:Wrong username or password')
            err.code = 401
            throw err
        }
        if(staffInfo.role.name != '下单员'){
            let err = new Error('Login error:Wrong user role')
            err.code = 403
            throw err
        }
        let token = jwt.sign({
            userName: staffInfo.name,
            userId: staffInfo._id
        }, key, { expiresIn: expiresIn })
        ctx.status = 200
        ctx.body = {
            token: token
        }
    },

    loginForOrderMethod: async (ctx) => {
        let {userName, password, supplyTag} = ctx.request.body
        console.log(userName, password, supplyTag)
        let hash = await CryptoJS.HmacSHA256(password, passwordKey)
        let staffInfo = await Staff.findOne({username: userName})
        .populate({path: 'supplyTag', select: 'name_ch'})
        .populate({path: 'role'})
        console.log('####')
        console.log(staffInfo)
        if(!staffInfo){
            let err = new Error('Account is not found')
            err.code = 401
            throw err
        }
        if(staffInfo.supplyTag && staffInfo.supplyTag._id != supplyTag){
            let err = new Error('Account does not match role') 
            err.code = 402
            throw err
        }
        if(staffInfo.workStatus === 'notActive'){
            let err = new Error('Login error:This user is not active')
            err.code = 403
            throw err
        }
        if(hash != staffInfo.password){
            let err = new Error('Login error:Wrong username or password')
            err.code = 401
            throw err
        }
        if(!staffInfo.supplyTag || staffInfo.role.name != '配单员'){
            let err = new Error('Login error:Wrong user role')
            err.code = 403
            throw err
        }
        let token = jwt.sign({
            userId: staffInfo._id,
            userName: staffInfo.name,
            supplyTag: staffInfo.supplyTag
        }, key, { expiresIn: expiresIn })
        ctx.status = 200
        ctx.body = {
            token: token
        }
    }
}
