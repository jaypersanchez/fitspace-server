import express from "express";
// import { userLogin, createUser, userInfo, deleteUser } from "../../controllers/users/index.js";
import { paypalController } from "../../controllers/paypal/index.js";
import verifyTokenMiddle from "../../middleware/verifyTokenMiddle.js";
const paymentRoute = express.Router();

//Stripe payment flow
//paymentRoute.post('/intents', verifyTokenMiddle, paymentController.paymentIntent)
//paypalRoute.post('/intents', paypalController.paymentIntent)

// paymentRoute.post("/new", verifyTokenMiddle, paymentController.newSubscription)
/*paypalRoute.post(
  "/subscribe",
  verifyTokenMiddle,
  paypalController.createSubscription
);*/
//paypalRoute.post("/new", verifyTokenMiddle, paypalController.paymentIntent);
//paypalRoute.get("/ptoken", paypalController.publishableToken);

export { paypalRoute };