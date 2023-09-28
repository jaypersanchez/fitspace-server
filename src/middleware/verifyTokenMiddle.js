import createHttpError from "http-errors";
import verifyDecodeJWT from "../tools/verifyAndDecode.js";
import userModel from "../models/userSchema.js";
import tokenBlacklistModel from "../models/tokenBlacklistSchema.js";

/**
 * @namespace middleware
 */

/**
 * @memberof middleware
 *
 */
const verifyTokenMiddle = async (req, res, next) => {
  try {
    //grabs the token from the header and removes "Bearer"
    const token = await req.headers.authorization.replace("Bearer ", "");
    console.log("token in middleware: ", token);
    //verifyDecodeJWT must be awaited as it is a returned promise
    const decodedToken = await verifyDecodeJWT(token);
    // check if the decoded token is blacklisted
    const tokenValidity = await tokenBlacklistModel.findOne({ token: token });
    // console.log("DECODED : ", decodedToken)
    console.log("tokenValidity: ", tokenValidity);
    if (tokenValidity) {
      console.log("token is blacklisted");
      res.status(401).send({ message: "Token blacklisted" });
      return undefined;
    }

    //if token => token is used to set the user
    if (decodedToken) {
      // Use decodedToken to find the user or check vs a locally stored token for time
      const user = await userModel.findById(decodedToken._id);
      req.user = user;
      if (user) {
        next();
      } else {
        next(createHttpError(404));
      }
    } else {
      res.status(307).send({ message: "Token not valid" });
    }
  } catch (error) {
    res.status(307).send({ message: "Token not valid" });
  }
};

export default verifyTokenMiddle;
