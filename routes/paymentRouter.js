const router = require('express').Router()
const PaymentCtrl = require('../controllers/paymentCtrl')
const auth = require('../middleware/auth')
const authAdmin = require('../middleware/authAdmin')

router.post('/payment', auth, PaymentCtrl.createPayment)
router.get('/success/:id',auth, PaymentCtrl.retrieveSession);
router.post('/update-payment',auth, PaymentCtrl.updateIfSuccess);
router.get('/payment', auth, authAdmin, PaymentCtrl.getPayments);

module.exports = router