import express from "express";
// import { userLogin, createUser, userInfo, deleteUser } from "../../controllers/users/index.js";
import { paymentController } from "../../controllers/payment/index.js";
import verifyTokenMiddle from "../../middleware/verifyTokenMiddle.js";
const paymentRoute = express.Router();

//Stripe payment flow
//paymentRoute.post('/intents', verifyTokenMiddle, paymentController.paymentIntent)
paymentRoute.post('/intents', paymentController.paymentIntent)
paymentRoute.get('/currencies', paymentController.getCurrencies);

// paymentRoute.post("/new", verifyTokenMiddle, paymentController.newSubscription)
paymentRoute.post(
  "/subscription-intent",
  paymentController.subscriptionIntent
);
paymentRoute.post(
  "/subscribe",
  paymentController.createSubscription
);
paymentRoute.post("/new", verifyTokenMiddle, paymentController.paymentIntent);
paymentRoute.get("/ptoken", paymentController.publishableToken);

export { paymentRoute };
