import mongoose from "mongoose";
import userModel from "../models/userSchema.js";
import { jwtAuth } from "../tools/index.js";

import Stripe from "stripe";
const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

/**
 * Function that creates a new user retuns the user ID
 * @param {*} req
 * @param {*} res
 * @returns
 */
async function createUserService(req, res) {
    try {
      const userCheck = await userModel.find({email: req.body.email})
      if(userCheck.length > 0) {
        res.status(403).send({message: "email already in use"})
      } else {
        const customerId = await stripe.customers.create({email:req.body.email, name: req.body.name});
        const newUser = new userModel({...req.body, stripeId: {customerId: customerId.id}});
        const { _id } = await newUser.save();
        const user = await userModel.findById(_id)
        //this is throwing up
        /*const token = await jwtAuth(user, "30m")
        const refreshToken = await jwtAuth(user, "1d") 
        console.log("signup tokens : ", token," | ", refreshToken)*/
        res.status(201).send({
          user: user,
          //accessToken: token,
          //refreshToken: refreshToken
        });
        //return undefined
      }

      } catch (error) {
        console.log(error);
        next(error);
      }
}

export default createUserService;
