import mongoose from "mongoose";
import userModel from "../models/userSchema.js";
import { jwtAuth } from "../tools/index.js";

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
        const newUser = new userModel(req.body);
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
