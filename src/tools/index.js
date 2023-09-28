import jwt from "jsonwebtoken";
import dotenv from "dotenv/config";

// A tool function used in middleware to generate a JWT token
// Uses a consistent piece of data to generate the token, user's ID is used for example in the token
export const jwtAuth = async (user, time) => {
  console.log("the secret is ", process.env.TOKEN_ACCESS_SECRET);
  const token = await generateJWTToken({ _id: user._id }, time);

  return token;
};

const generateJWTToken = (payload, time) =>
  new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      process.env.TOKEN_ACCESS_SECRET,
      { expiresIn: time },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      }
    );
  });
