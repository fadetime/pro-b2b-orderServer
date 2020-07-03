const compose = require('koa-compose')

//Handling Error
async function errorHandling(ctx, next) {
    try {
        await next()
    } catch (err) {
        console.log(err)
        let {code,message,etc} = err
        console.log('code')
        console.log(code)
        ctx.status = code || 500
        let payload = {
            error: message || 'Internal Server Error'
        }
        if(etc){
            payload['details'] = etc
        }
        ctx.body = payload
    }
}
const bodyParser = require('koa-bodyparser')

//Handling CORS
const cors = require('koa2-cors')

module.exports = () => {
    return compose([errorHandling,bodyParser(),cors()])
}