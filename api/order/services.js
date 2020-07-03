const Staff = require('../../db/models/staffs')
const Supplies = require('../../db/models/supplies')
const moment = require('moment')

module.exports = {
    createInvoiceNum: async (staff, slot, primary) => {
        let staffInfo = await Staff.findById(staff).populate({ path: 'supplyTag' })
        let suppliesInfo = await Supplies.findOneAndUpdate({ _id: staffInfo.supplyTag }, { $inc: { nextInvSeqNumber: 1 } }, { new: true })
        let invNumberStr = parseInt((new Date().getFullYear() + '')[2] + (new Date().getFullYear() + '')[3] + '00000000') + suppliesInfo.nextInvSeqNumber + ''
        return invNumberStr
    },

    nextPayDate: async (agreeDate, payPeriod, someDay) => {
        // console.log(agreeDate,payPeriod,someDay)
        if (!agreeDate || !payPeriod || !someDay) return ""

        agreeDate = new Date(new Date(agreeDate).toDateString())
        let month = agreeDate.getMonth()
        let date = agreeDate.getDate()
        let day = agreeDate.getDay()

        let todayMonth = new Date(someDay).getMonth()
        let todayDate = new Date(someDay).getDate()
        let todayDay = new Date(someDay).getDay()

        let diffMonth = todayMonth - month
        let diffDate = todayDate - date
        let diffDay = todayDay - day
        agreeDate = new Date(agreeDate).toISOString()
        let momentAgreeDate = moment(agreeDate) //.format('YYYY-MM-DD')
        let momentTodayDate = new Date(someDay).toDateString()
        momentTodayDate = new Date(momentTodayDate).toISOString()
        let diff = momentAgreeDate.diff(momentTodayDate, "days")
        if (diff > 0) {
            return momentAgreeDate.format("YYYY-MM-DD")
        }
        let returnDate
        if (payPeriod == "1") {
            return moment(momentTodayDate).format("YYYY-MM-DD") // 每天都付款
        } else if (payPeriod == "7") {
            // if(diffTmp==0) return moment(momentTodayDate).format('YYYY-MM-DD')
            returnDate = new Date(someDay).setDate(todayDate - diffDay + 7)
        } else if (payPeriod == "15") {
            let diffTmp = diff % 15
            console.log(diff, diffTmp, diffDate)
            if (diffTmp == 0) return moment(momentTodayDate).format("YYYY-MM-DD")
            returnDate = new Date(someDay).setDate(todayDate + diffTmp + 15)
        } else if (payPeriod == "30") {
            returnDate = new Date(someDay).setDate(todayDate - diffDate)
            if (diffDate > 0) {
                returnDate = new Date(returnDate).setMonth(todayMonth + 1)
            }
        } else if (payPeriod == "60") {
            diffMonth = diffMonth % 2
            returnDate = new Date(someDay).setDate(todayDate - diffDate)
            if (diffMonth == 0 && diffDate <= 0) {
                returnDate = new Date(returnDate).setMonth(todayMonth)
            } else if (diffMonth == 0 && diffDate > 0) {
                returnDate = new Date(returnDate).setMonth(todayMonth + 2)
            } else {
                returnDate = new Date(returnDate).setMonth(todayMonth + 1)
            }
        }
        returnDate = new Date(returnDate).toISOString()
        return moment(returnDate).format("YYYY-MM-DD")
    }
}