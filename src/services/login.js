import userModel from "../models/userSchema.js";
import userWorkoutWeekSchema from "../models/userWorkoutWeekSchema.js";
import { jwtAuth } from "../tools/index.js";
import moment from "moment/moment.js";

/**
 * A function that logs in a user
 * @param {*} req The express request object
 * @param {*} res The express response object
 * @param {*} next The express next function
 * @returns {object} The response object containing the user and the token in the header
 */
async function loginUser(req, res, next) {
  try {
    const user = await userModel.checkCredentials(
      req.body.email,
      req.body.password
    );
    console.log("LOGIN:", user);
    if (await user) {
      //const token = await jwtAuth(user, "30m")
      //const refreshToken = await jwtAuth(user, "1d")
      //console.log("THE RFRSH: ", refreshToken)
      const data = await userModel.findById(user._id).populate({
        path: "workoutPlans",
      });

      // const workouts = [];

      // if (data.workoutPlans.length > 0) {
      //   for (const plan of data.workoutPlans) {
      //     const startDate = moment(plan.startDate);
      //     const currentDate = moment();

      //     const duration = moment.duration(currentDate.diff(startDate));
      //     const weeks = Math.floor(duration.asWeeks());

      //     const weekId = plan.weeks[weeks].toString();
      //     const week = await userWorkoutWeekSchema.findById(weekId);
      //     workouts.push(week);
      //   }
      // }

      res.status(200).send({
        loggedIn: true,
        user: {
          data,
          // workoutPlans:
          //   workouts.length != 1 ? workouts : { ...workouts[0]._doc },
        },
      });
      /*res.status(200).send({loggedIn: true, user:user, 
              accessToken: token,
              refreshToken: refreshToken})*/
    } else {
      res.status(401).send({ loggedIn: false, message: "Wrong credentials" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
}

export default loginUser;
