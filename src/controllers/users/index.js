import mongoose from "mongoose";
import createUserService from "../../services/createUserService.js";
import { validationResult } from "express-validator";
import User from "../../models/userSchema.js";
import Level from "../../models/levelSchema.js"
import GymType from "../../models/gymTypeSchema.js"
import GymGoal from "../../models/gymGoalSchema.js"
import loginUser from "../../services/login.js";
import { resetToken } from "../../services/resetTokens.js";
//this is the schema that contains collections of workout history.
import CompleteWorkoutweek from "../../models/completedWorkoutWeekSchema.js"

/**
 *  The user controller
 * @namespace userController
 */
export const userController = {

  getLevelRef: async(req, res, next) => {
    try {
      // Fetch all currencies from the database
      const levels = await Level.find();
      console.log(`${levels}`)
      // Return the currencies as a JSON response
      res.json(levels);
    }
    catch (error) {
      console.warn("ERROR: ", error.message);
      res.json({error: error.message})
    }
  },

  getGymTypeRef: async(req, res, next) => {
    try {
      // Fetch all currencies from the database
      const types = await GymType.find();
      console.log(`${types}`)
      // Return the currencies as a JSON response
      res.json(types);
    }
    catch (error) {
      console.warn("ERROR: ", error.message);
      res.json({error: error.message})
    }
  },

  getGymGoalRef: async(req, res, next) => {
    try {
      // Fetch all currencies from the database
      const types = await GymGoal.find();
      console.log(`${types}`)
      // Return the currencies as a JSON response
      res.json(types);
    }
    catch (error) {
      console.warn("ERROR: ", error.message);
      res.json({error: error.message})
    }
  },

  resetWorkoutWeeks: async (req, res, next) => {
    try {
      const { _id } = req.body;
      console.log(`reset for ${_id}`)
      
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ error: 'Invalid request parameters' });
      }
      console.log(`find user ${_id}`)
      const user = await User.findOneAndUpdate(
        { _id }, // Find the user by _id
        {
          $set: {
            'workoutPlans.$[].complete': false, // Update all workoutPlans.complete to false
            'workoutPlans.$[].completed_date': null, // Set completed_date to null
          },
        },
        { multi: true } // Update all matching elements
      );
      console.log(`found user ${_id}`)
      if (!user) {
        console.error(`User with _id ${_id} not found`);
        return res.status(404).json({ error: 'User not found' });
      }
  
      return res.status(200).json({ message: 'User workout plans reset successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  

  setCompleteWeek: async(req, res, next) => {
    const userObj = req.body;
    console.log(`${userObj._id}::${userObj.weekid}::${userObj.complete}`);
    try {
      const { _id, weekid, complete } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(_id) || complete === undefined) {
        return res.status(400).json({ error: 'Invalid request parameters' });
      }
  
      const user = await User.findOneAndUpdate(
        { 'workoutPlans._id': weekid },
        {
          $set: {
            'workoutPlans.$.complete': complete,
            'workoutPlans.$.completed_date': complete ? new Date() : null,
          },
        }
      );
  
      if (!user) {
        console.error(`User with _id ${_id} not found`);
        return res.status(404).json({ error: 'User not found' });
      }

      // Now, create a new CompleteWorkoutWeek instance and save it
      if (complete) {
        const completedWeekData = user.workoutPlans.find((week) => week._id.toString() === weekid);
        if (completedWeekData) {
          const completeWeek = new CompleteWorkoutweek({
            userId: _id, // Set the user's ID
            completedDate: new Date(), // Set the completion date
            weekData: completedWeekData, // Set the completed week data
          });

          // Save the completed week
          await completeWeek.save();
        }
      }
  
      return res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    
  },

  /**
   * @funtion getWeeklyPlan
   * @memberof userController
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {Object} next The express next function
   */
  getWeeklyPlan: async(req, res, next) => {
    try {

      const userobj = req.query.email
      console.log(`Email ${userobj}`)
      // Validate that _id is provided
      /*if (!email) {
        return res.status(400).json({ message: 'Missing _id in the request body' });
      }*/
  
      // Define your collation settings
      const collationSettings = {
        locale: "en_US", // Specify the locale
        caseLevel: false, // Enable case sensitivity
        strength: 1, // Specify the strength (1 for primary, 2 for secondary, etc.)
      };
  
      // Query the database with collation settings
      /*const result = await User.find(
        {email:userobj.email}, // Query by _id
        { workoutPlans: 1, _id: 0 }, // Projection (null to retrieve all fields)
        { collation: collationSettings }
      );*/

      const result = await User.aggregate([
        { $match: { email: userobj } }, // Match the user by email
        {
          $project: {
            workoutPlans: {
              $filter: {
                input: '$workoutPlans',
                as: 'workoutPlan',
                cond: { $eq: ['$$workoutPlan.complete', false] },
              },
            },
          },
        },
        { $unwind: '$workoutPlans' }, // Unwind the filtered workoutPlans array
        { $limit: 1 }, // Limit to the first document
      ]);
  
      if (result.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Assuming you want to send the workoutPlans array in the response
      const workoutPlans = result[0].workoutPlans;
  
      res.json(workoutPlans);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * @funtion createUser
   * @memberof userController
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {Object} next The express next function
   */
  createUser: async (req, res, next) => {
    const errorsList = validationResult(req);
    try {
      if (errorsList.isEmpty()) {
        console.log(1);
        await createUserService(req, res);
      } else {
        res.status(500).send({ errors: errorsList });
      }
    } catch (error) {
      res.status(500).send({ errors: error });
    }
  },
  /**
   * The login user controller returns an access token and a refresh token
   * @funtion userLogin
   * @memberof userController
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {Object} next The express next function
   * @returns {Object} The user information and token in the header
   */
  userLogin: async (req, res, next) => {
    try {
      const errorsList = validationResult(req);
      if (errorsList.isEmpty()) {
        await loginUser(req, res, next);
      } else {
        let error = new Error();
        error.httpStatusCode = 500;
        error.message = errorsList;
        throw error;
      }
    } catch (error) {
      res.status(500).send(error);
      return undefined;
    }
  },
  /**
   * The user info controller returns the user info
   * @funtion userInfo
   * @memberof userController
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {Object} next The express next function
   * @returns {Object} The user info
   */
  userInfo: async (req, res, next) => {
    try {
      console.log({ body: req.query });
      const user = await User.findById(req.query._id);
      console.log({ user });
      res.status(200).send(user);
    } catch (error) {
      res.status(500).send(error);
      return undefined;
    }
  },
  /**
   * The delete user controller returns the user info
   * @funtion deleteUser
   * @memberof userController
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {Object} next The express next function
   * @returns {Object} response object with confirmation message
   */
  deleteUser: async (req, res, next) => {
    try {
      let id = req.params.userid;
      let deleteResponse = await User.findByIdAndDelete(id);
      console.log("THE DELETE RESPONSE", deleteResponse);
      if (deleteResponse !== null) {
        res.status(200).send({ message: "User deleted" });
        return undefined;
      } else {
        res.status(404).send({ message: "User not found" });
        return undefined;
      }
    } catch (error) {
      return res.status(500).send({ message: "Something went wrong" });
    }
  },
  /**
   * The reset refresh token controller returns the user info and a new refresh token and access token
   * @funtion resetRefreshToken
   * @memberof userController
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {Object} next The express next function
   * @returns {Object} response object new refresh token and access token
   */
  resetRefreshToken: async (req, res, next) => {
    const errorsList = validationResult(req);
    try {
      if (errorsList.isEmpty()) {
        await resetToken(req, res, next);
      } else {
        throw new Error(errorsList);
      }
      return undefined;
    } catch (error) {
      return res
        .status(500)
        .send({ status: "failure", message: "Something went wrong" });
    }
  },

  updateUser: async (req, res, next) => {
    // const user_data = req.body;

    try {
      const data = req.body;
      console.log(req.body);
      const user = await User.findById(data._id);
      if (!user) return res.status(404).json({ msg: "User not found" });

      const updates = Object.keys(req.body);
      updates.forEach((update) => (user[update] = req.body[update]));
      await user.save();
      let updatedUser = await User.findById(data._id);
      res.status(201).json(updatedUser);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  },



  updateUserWorkoutPlan: async (req, res, next) => {
    // const user_data = req.body;

    try {
      const data = req.body;
      //need index which is the workout week.
      console.log(`updateUserTO ${JSON.stringify(data.userid)}::
                                ${JSON.stringify(data.index)}`);
      const user = await User.findById(data.userid);
      console.log(`updatingFROM ${JSON.stringify(user._id)}::
                                ${JSON.stringify(user.name)}::
                                ${JSON.stringify(user.workoutPlans[data.index].complete)}`);
      if (!user) return res.status(404).json({ msg: "User not found" });
      //once user is found, just update
      user.workoutPlans[data.index].complete = true
      user.workoutPlans[data.index].completed_date = new Date();
      //const updates = Object.keys(req.body).filter(update => update !== '_id');
      //console.log(`updates ${JSON.stringify(updates)}`)
      //updates.forEach(update => (user[update] = req.body[update]));
      await user.save();
      
      
      let updatedUser = await User.findById(data.userid);
      console.log(`updatedUser ${updatedUser.workoutPlans[data.index].complete}`)
      res.status(201).json(updatedUser);
    } catch (err) {
      console.error(`UpdateUser Error ${err.message}`);
      console.error(`UpdateUser Error ${err.message}`);
      res.status(500).send("Server error");
    }
  },

  getWorkoutHistory: async (req, res, next) => {
      try {
          
          const data = req.body;
          let userId = data.userid;
          console.log(`Getting Workout History for ${userId}`)
          // Find completed workout data for the user
          const completedWorkouts = await CompleteWorkoutweek.find({ userId });

          // Calculate the number of completed weeks
          const completedWeeks = completedWorkouts.length;

          // Find the user's registration date (assuming you have a registeredDate field)
          const user = await User.findById(userId);

          // Calculate the duration in days
          const registrationDate = user.registeredDate;
          const currentDate = new Date();
          const durationInDays = Math.floor((currentDate - registrationDate) / (1000 * 60 * 60 * 24));

          // Calculate completion rate
          const completionRate = (completedWeeks / durationInDays) * 100;

          // Prepare a report object
          const report = {
            completedWeeks,
            durationInDays,
            completionRate,
          };

          return res.json(report);
      }
      catch(error) {
        console.error('Error generating workout report:', error);
        throw error;
      }
  },

};
