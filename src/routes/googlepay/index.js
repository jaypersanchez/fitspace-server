import express from "express";
// import { userLogin, createUser, userInfo, deleteUser } from "../../controllers/users/index.js";
import { googlePayController } from "../../controllers/googlepay/index.js";
import verifyTokenMiddle from "../../middleware/verifyTokenMiddle.js";
const googlePayRoute = express.Router();

// Set up the Google Pay API
const api = new GooglePayAPI({
    merchantId: 'YOUR_MERCHANT_ID',
    environment: 'TEST'
});
  
  // Create the payment request 
app.post('/payment', (req, res) => {
    const request = api.createPaymentRequest({
      amount: 45.00,
      currencyCode: 'USD'
    });
  
    res.send(request);
});
  
  // Handle the payment token
 app.post('/payment-token', (req, res) => {
    const token = api.processPaymentToken(req.paymentToken);
  
    res.send(token);
});
  

export { googlePayRoute };