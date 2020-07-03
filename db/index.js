const mongoose = require('mongoose')
const {database} = require('../config/index')()

module.exports = {
    connect:()=>{
        return new Promise((resolve,reject)=>{
            console.log(database)
            mongoose.connect(database,{ useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true },(err)=>{
                if(err){
                    reject(`ERROR: Connected failed, please check your MongoDB with ${database}`)
                }else{
                    resolve(`INFO: Successfully connected to MongoDB at ${database}`)
                }
            })
        })
    }
}