import mongoose from "mongoose";
import { validationResult } from "express-validator";
import userModel from "../../models/userSchema.js";
import loginUser from "../../services/login.js";
import { resetToken } from "../../services/resetTokens.js";
import { searchExercise, getAllExercises, getAllExerciseLevels } from "../../services/exerciseSearch.js";
import {
  createFullWorkoutPlan,
  createWeeklyWorkoutPlan,
} from "../../services/workoutGenerator.js";
/**
 *  The user controller
 * @namespace exerciseController
 */

export const exerciseController = {
  /**
   * @funtion createUser
   * @memberof paymentController
   * @param {Object} req The express request object
   * @param {Object} res The express response object
   * @param {Object} next The express next function
   */

  getExercises: async (req, res, next) => {
    const fields = req.body;
    console.log("Getting all exercises", fields);
    try {
      const results = await getAllExercises();
      return res.json({
        success: true,
        data: results,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  },

  searchByLevel: async(req, res, next) => {
    const searchString = req.body.level;
  },

  getAllExerciseLevels: async(req, res, next) => {
      try {
        const results = await getAllExerciseLevels();
        return res.json({
          success: true,
          data: results,
        })

      } catch (err) {
        return res.status(500).json({
          success: false,
          error: "Server error",
        });
      }

  },

  search: async (req, res, next) => {
    const searchString = req.body.name;
    console.log("The search string is", searchString);
    try {
      const results = await searchExercise(searchString);
      return res.json({
        success: true,
        data: results,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  },

  createPlan: async (req, res, next) => {
    const id = req.body.id;
    console.log("The user is", id);
    try {
      const user = await userModel.findById(id);
      console.log({ user });
      await createFullWorkoutPlan(user);
      /*
      // temporary find user and populate workouts
      const foundUser = await userModel.findById(user.users._id).populate({
        path: "workoutPlans",
      });*/

      return res.json({
        success: true,
        user: user.id,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  },
};
