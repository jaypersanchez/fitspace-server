import mongoose from "mongoose";
import createUserService from "../../services/createUserService.js";
import { validationResult } from "express-validator";
import UserModel from "../../models/userSchema.js";
import currenciesModel from "../../models/curennciesSchema.js";
import loginUser from "../../services/login.js";
import { resetToken } from "../../services/resetTokens.js";
import Stripe from "stripe";
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);
console.log(`Stripe Key ${process.env.STRIPE_SECRET_KEY}`);

import moment from "moment/moment.js";
/**
 *  The user controller
 * @namespace paymentController
 */

export const paymentController = {
  getCurrencies: async (req, res, next) => {
    try {
      // Fetch all currencies from the database
      const currencies = await currenciesModel.find();
      console.log(`${currencies}`);
      // Return the currencies as a JSON response
      res.json(currencies);
    } catch (error) {
      console.warn("ERROR: ", error.message);
      res.json({ error: error.message });
    }
  },

  /**
   * @funtion createUser
   * @memberof paymentController
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {Object} next The express next function
   */
  paymentIntent: async (req, res, next) => {
    try {
      console.log(`Payment Intent`, req.body);

      const UserInfo = await UserModel.findById(req.body._id);

      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: UserInfo.customerId },
        { apiVersion: "2023-10-16" }
      );

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(req.body.amount * 100),
        currency: req.body.currency,
        customer: UserInfo.customerId,
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        payment_method_types: ["card", "us_bank_account", "link", "cashapp"],
        // automatic_payment_methods: {
        //   enabled: true,
        // },
      });

      res.json({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: UserInfo.customerId,
      });
    } catch (error) {
      console.warn("ERROR: ", error.message);
      res.json({ error: error.message });
    }
  },
  /**
   * @funtion createUser
   * @memberof paymentController
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {Object} next The express next function
   */

  // NOT Working
  publishableToken: async (req, res, next) => {
    try {
      let key = process.env.STRIPE_PUBLISHABLE_KEY;
      console.log("Publishable key");
      res.send({
        publishableKey: key,
      });
    } catch (error) {
      console.warn("Problem with publishable key");
      console.warn("ERROR: ", error);
      res.status(500).send({ errors: error });
    }
  },

  subscriptionIntent: async (req, res, next) => {
    console.log("creating a Subscription Intent");
    try {
      const { _id } = req.body;

      const UserInfo = await UserModel.findById(_id);

      console.log({ UserInfo: UserInfo.stripeId.customerId });

      const setupIntent = await stripe.setupIntents.create({
        customer: UserInfo.stripeId.customerId,
        payment_method_types: ["card"],
      });

      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: UserInfo.stripeId.customerId },
        { apiVersion: "2020-08-27" }
      );

      console.log({ setupIntent: setupIntent });

      return res.json({
        paymentIntent: setupIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: UserInfo.stripeId.customerId,
        setupId: setupIntent.id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  createSubscription: async (req, res, next) => {
    console.log("Subscribing");
    try {
      const { _id, plan, setupId } = req.body;

      const UserInfo = await UserModel.findById(_id);

      const nextPaymentSchedule = (plan, date) => {
        switch (plan) {
          case "month":
            return moment(date).add(1, "months").toISOString();
          case "year":
            return moment(date).add(1, "years").toISOString();
          default:
            return moment(date).add(7, "days").toISOString();
        }
      };

      const setupIntents = await stripe.setupIntents.retrieve(setupId);

      const PRICE_ID = (plan) => {
        switch (plan) {
          case "month":
            return process.env.SUBS_MONTHLY_PAY;
          case "year":
            return process.env.SUBS_YEARLY_PAY;
          default:
            return process.env.SUBS_MONTHLY_PAY;
        }
      };

      // if (UserInfo.stripeId.subscriptionId) {
      //   await stripe.subscriptions.cancel(UserInfo.stripeId.subscriptionId);
      // }

      const subscription = await stripe.subscriptions.create({
        customer: UserInfo.stripeId.customerId,
        items: [{ price: PRICE_ID(plan) }],
        default_payment_method: setupIntents.payment_method,
        payment_settings: {
          payment_method_types: ["card", "us_bank_account"],
        },
      });

      console.log({ subscription });

      await UserModel.findByIdAndUpdate(
        { _id },
        {
          stripeId: {
            ...UserInfo.stripeId,
            setupId,
            subscriptionId: subscription.id,
          },
          subscriptionDate: moment().toISOString(),
          nextPaymentSchedule: nextPaymentSchedule(
            plan,
            UserInfo.registeredDate
          ),
        },
        { new: true }
      );

      return res.json({
        customer: UserInfo.stripeId.customerId,
        status: subscription.status,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  cancelSubscription: async (req, res, next) => {
    console.log("creating a Subscription Intent");
    try {
      const { _id } = req.body;

      const UserInfo = await UserModel.findById(_id);

      const nextPaymentSchedule = moment(UserInfo.registeredDate)
        .add(7, "days")
        .toISOString();

      const subscription = await stripe.subscriptions.cancel(
        UserInfo.stripeId.subscriptionId
      );

      await UserModel.findByIdAndUpdate(
        { _id },
        {
          stripeId: {
            ...UserInfo.stripeId,
            subscriptionId: null,
          },
          paymentSchedule: "trial",
          nextPaymentSchedule,
        },
        { new: true }
      );

      console.log({ subscription });
      return res.json({
        subscription,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

// export {deleteUser,userLogin, createUser, userInfo};
