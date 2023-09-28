import tokenBlacklistModel from "../models/tokenBlacklistSchema.js";
import { jwtAuth } from "../tools/index.js";

/**
 *
 */
async function resetToken(req, res, next) {
  // check if the refresh token is blacklisted
  // if it is not blacklisted, validation check is not needed because the token is already validated in the middleware
  // else if it is blacklisted, then return an error
  // if it is valid, then check if the access token is on the blacklist
  // if it is not on the blacklist, then add the token to the blacklist
  // if it is on the blacklist, then ignore it
  // add the refresh token to the blacklist
  // generate a new access token and refresh token and return them

  try {
    console.log("inside try");
    const refreshToken = req.headers.refreshtoken;
    console.log("refresh token: ", refreshToken);
    const accessToken = req.headers.accesstoken;
    const refreshTokenBlacklist = await tokenBlacklistModel.findOne({
      token: refreshToken,
      tokenType: "refresh",
    });
    console.log("blacklisted refresh token response:", refreshTokenBlacklist);
    if (refreshTokenBlacklist) {
      res.status(401).send({ message: "Token blacklisted" });
      // return undefined
    } else {
      const accessTokenBlacklist = await tokenBlacklistModel.findOne({
        token: accessToken,
        tokenType: "access",
      });
      console.log("Blacklisted access token response:", accessTokenBlacklist);
      if (!accessTokenBlacklist) {
        await tokenBlacklistModel.create({
          token: accessToken,
          expiration: Date.now(),
          tokenType: "access",
          user: req.user._id,
        });
      }
      await tokenBlacklistModel.create({
        token: refreshToken,
        expiration: Date.now(),
        tokenType: "refresh",
        user: req.user._id,
      });
      const newAccessToken = await jwtAuth(req.user, "30m");
      const newRefreshToken = await jwtAuth(req.user, "1d");
      res.status(200).send({
        message: "New tokens generated",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    }
  } catch (error) {
    console.log("fired");
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
}

export { resetToken };
