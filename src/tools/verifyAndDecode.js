import dotenv from "dotenv/config.js";
import jwt from "jsonwebtoken";
// Takes token as a param and returns a promise
const verifyDecodeJWT = (token) =>
  // promise resolves to return decoded token (_id)

  new Promise((res, rej) => {
    console.log(process.env.TOKEN_ACCESS_SECRET);
    jwt.verify(token, process.env.TOKEN_ACCESS_SECRET, (err, decodedToken) => {
      if (err) rej(err);
      else res(decodedToken);
    });
  });

export default verifyDecodeJWT;
