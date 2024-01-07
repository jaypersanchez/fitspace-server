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
      const trial_period = parseInt(process.env.TRIAL_PERIOD_DAYS || 7);

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

      const price = {
        month: process.env.SUBS_MONTHLY_PAY,
        year: process.env.SUBS_YEARLY_PAY,
        trial: process.env.SUBS_MONTHLY_PAY,
      };

      console.log({ plan: UserInfo.paymentSchedule, plan });

      if (UserInfo.stripeId.subscriptionId) {
        await stripe.subscriptions.cancel(UserInfo.stripeId.subscriptionId);
      }

      const subscription = await stripe.subscriptions.create({
        customer: UserInfo.stripeId.customerId,
        items: [{ price: price[plan] }],
        default_payment_method: setupIntents.payment_method,
        payment_settings: {
          payment_method_types: ["card", "us_bank_account"],
        },
        ...(plan === "trial" ? { trial_period_days: trial_period } : {}),
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
          subscriptionDate: moment.unix(subscription.created).toISOString(),
          paymentActive: true,
          subscriptionStatus: subscription.status,
          ...(subscription.trial_end
            ? { trialPeriod: moment.unix(subscription.trial_end).toISOString() }
            : {}),
          // nextPaymentSchedule: nextPaymentSchedule(
          //   plan,
          //   UserInfo.registeredDate
          // ),
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
    console.log("Canceling Subscriptio");
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
          paymentSchedule: "trial",
          paymentActive: false,
          subscriptionStatus: subscription.status,

          // nextPaymentSchedule,
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

  checkSubscription: async (req, res, next) => {
    console.log("Checking Subscription");
    try {
      const { _id } = req.body;

      const UserInfo = await UserModel.findById(_id);

      const subscription = await stripe.subscriptions.retrieve(
        UserInfo.stripeId.subscriptionId
      );

      await UserModel.findByIdAndUpdate(
        { _id },
        {
          subscriptionStatus: subscription.status,
          paymentActive: subscription.status !== "canceled",
          paymentSchedule:
            subscription.status !== "trialing"
              ? subscription.plan.interval
              : "trial",
          ...(subscription.trial_end
            ? { trialPeriod: moment.unix(subscription.trial_end).toISOString() }
            : {}),
        },
        { new: true }
      );

      console.log({ subscription });
      return res.json({
        subscriptionStatus: subscription.status,
        paymentActive: subscription.status !== "canceled",
        paymentSchedule:
          subscription.status !== "trialing"
            ? subscription.plan.interval
            : "trial",
        trialPeriod: moment.unix(subscription.trial_end).toISOString() || null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

// export {deleteUser,userLogin, createUser, userInfo};
