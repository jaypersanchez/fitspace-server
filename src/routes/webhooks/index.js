import express from "express";
// import { userLogin, createUser, userInfo, deleteUser } from "../../controllers/users/index.js";
import { userController } from "../../controllers/users/index.js";
import {
  newUserValidation,
  tokenValidation,
  userLoginValidation,
} from "../../validation/index.js";
import verifyTokenMiddle from "../../middleware/verifyTokenMiddle.js";
import Stripe from "stripe";
const webhookRoute = express.Router();
const stripeKey = process.env.STRIPE_KEY;
const stripe = new Stripe(stripeKey);

const endpointSecret =
  "whsec_fd643be495039e13632d225667b9d313122f3a26a921b23a35bae3e5681e5460";

webhookRoute.post(
  "/collect",
  express.raw({ type: "application/json" }),
  (request, response) => {
    const sig = request.headers["stripe-signature"];
    console.log("the signature is: ", sig);

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
      console.log("the event is: ", event);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
        const customerSubscriptionCreated = event.data.object;
        // Then define and call a function to handle the event customer.subscription.created
        break;
      case "customer.subscription.deleted":
        const customerSubscriptionDeleted = event.data.object;
        // Then define and call a function to handle the event customer.subscription.deleted
        break;
      case "customer.subscription.paused":
        const customerSubscriptionPaused = event.data.object;
        // Then define and call a function to handle the event customer.subscription.paused
        break;
      case "invoice.payment_succeeded":
        const invoicePaymentSucceeded = event.data.object;
        // Then define and call a function to handle the event invoice.payment_succeeded
        break;
      case "payment_intent.created":
        const paymentIntentCreated = event.data.object;
        // Then define and call a function to handle the event payment_intent.created
        break;
      case "payment_intent.payment_failed":
        const paymentIntentPaymentFailed = event.data.object;
        // Then define and call a function to handle the event payment_intent.payment_failed
        break;
      case "payment_intent.succeeded":
        const paymentIntentSucceeded = event.data.object;
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

export { webhookRoute };
