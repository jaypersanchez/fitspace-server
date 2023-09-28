import mongoose from "mongoose";
import createUserService from "../../services/createUserService.js";
import { validationResult } from "express-validator";
import UserModel from "../../models/userSchema.js";
import loginUser from "../../services/login.js";
import { resetToken } from "../../services/resetTokens.js";
import Stripe from "stripe";
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);
console.log(`Stripe Key ${process.env.STRIPE_SECRET_KEY}`)
/**
 *  The user controller
 * @namespace paypalController
 */

export const paypalController = {
  /**
   * @funtion createUser
   * @memberof paypalController
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {Object} next The express next function
   */
 

  
};

// export {deleteUser,userLogin, createUser, userInfo};
