// THIS FILE IS TEMPORARY AND TO BE REMOVED ONCE CORRECT IMPLEMENTATION IS DONE

import mongoose from "mongoose";
import Exercise from "../models/exerciseSchema.js";
import userWorkoutPlanSchema from "../models/userWorkoutPlanSchema.js";
import userWorkoutWeekSchema from "../models/userWorkoutWeekSchema.js";
import UserModel from "../models/userSchema.js";
import { shuffleArray } from "./shuffleArray.js";
import { isDateOlderThan16Years } from "./dateCheck.js";
// const Exercise = require("./exercise-model");

const createWeeklyWorkoutPlan = async (user) => {
  try {
    const age = user.age;
    const difficultyLevel = user.level;
    // const equipment = user.equipment;
    const frequency = user.frequency;
    const notInclude = getNotIncluded(difficultyLevel);
    let workouts = [];

    function getNotIncluded(level) {
      if (level === "beginner") {
        return ["adv", "Kids"];
      } else if (level === "advanced") {
        return ["Kids", "bg"];
      } else {
        return ["bg", "adv"];
      }
    }

    // Select exercises for kids workouts if user is younger than 18
    if (!isDateOlderThan16Years(age)) {
      for (let i = 0; i < frequency; i++) {
        let exercises = await Exercise.find({ level: "Kids" });
        exercises = shuffleArray(exercises);
        console.log("the kids exercises are: ", exercises);
        let workout = [];
        for (let j = 0; j < 4; j++) {
          let exercise = exercises[j];
          workout.push(exercise);
        }
        workouts.push(workout);
      }
    } else {
      let categories = ["pull", "push", "lower body"];

      // Shuffle the categories array so the order is random
      categories = shuffleArray(categories);
      console.log("The categories are: ", categories);
      for (let i = 0; i < frequency; i++) {
        let category = categories[i % categories.length];
        let exercises = await Exercise.find({
          category: category,
          level: { $nin: notInclude },
        });
        console.log("the exercises: ", exercises);
        exercises = shuffleArray(exercises);
        let workout = [];
        for (let j = 0; j < 4; j++) {
          let exercise = exercises[j];
          workout.push(exercise);
        }

        // If user is advanced, add an extra exercise to each workout
        let extraExercise;
        if (category === "pull" || category === "push") {
          extraExercise = await Exercise.findOne({ category: "core" });
        } else {
          extraExercise = await Exercise.findOne({ category: "cardio" });
        }
        workout.push(extraExercise);

        workouts.push(workout);
      }
    }
    const formattedWorkouts = formatWeeklyWorkoutData(workouts, user);
    console.log("The formatted workouts are: ", formattedWorkouts);

    return formattedWorkouts;
  } catch (error) {
    console.error(error);
  }
};

function formatWeeklyWorkoutData(workouts, user) {
  // format the data to be in the userWorkoutWeek schema
  const weekData = {
    user: user._id,
    week: 0,
    workoutsPerWeek: user.frequency,
    workouts: [],
  };
  const formattedData = workouts.map((workout, idx) => {
    console.log("check for type: ", workout);
    const workouts = {
      day: idx,
      workoutType: workout[0].category,
      complete: false,
      exercises: [],
    };
    const formattedWorkout = workout.map((exercise) => {
      workouts.exercises.push({
        exercise: exercise._id,
        reps: 10,
        sets: 4,
        setsCompleted: 0,
        videoUrl: exercise.videoUrl,
        weight: exercise.startingWeight,
        name: exercise.name,
        complete: false,
      });
    });
    return workouts;
  });
  return formattedData;
}

// The tag prop can be sorted like this, pre created formats can be created for each type of workout
// const tags = {
//     bodyPart: ['chest', 'shoulders', 'legs', 'back', 'arms'],
//     type: ['cardio', 'strength'],
//     equipment: ['none', 'dumbbells', 'barbell'],
//     difficulty: ['beginner', 'intermediate', 'advanced'],
//     targetMuscleGroup: ['biceps', 'triceps', 'abs'],
//     trainingGoal: ['muscle building', 'fat loss', 'endurance'],
//   }

async function createFullWorkoutPlan(user) {
  try {
    // Define the number of weeks for 2 months
    const numberOfWeeks = 8;

    // Create an array to store the weekly workout plans
    let weeklyPlans = [];

    // Loop through the number of weeks and create a weekly workout plan
    for (let i = 0; i < numberOfWeeks; i++) {
      let weeklyPlan = await createWeeklyWorkoutPlan(user);
      weeklyPlans.push(weeklyPlan);
    }
    console.log("The weekly plans", weeklyPlans);

    // Save the weekly workout plans to the database
    const savedWeeklyPlans = await Promise.all(
      weeklyPlans.map(async (plan, idx) => {
        // creates a new instance of the userWorkoutWeek model and saves it to the database
        let newWeek = new userWorkoutWeekSchema({
          user: user._id,
          workouts: plan,
          workoutsPerWeek: user.frequency,
          weekNumber: idx + 1,
        });
        let { _id } = await newWeek.save();
        return _id;
      })
    );
    console.log("The saved Weekly Plans", savedWeeklyPlans);

    // Create a full workout plan by referencing the saved weekly plans
    const fullWorkoutPlan = {
      user: user._id,
      weeks: savedWeeklyPlans.map((plan) => plan._id),
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 604800000 * numberOfWeeks),
    };

    console.log("full workout plan", fullWorkoutPlan);

    // Save the full workout plan to the database
    const newWorkoutPlan = new userWorkoutPlanSchema(fullWorkoutPlan);
    const savedFullWorkoutPlan = await newWorkoutPlan.save();
    console.log("The saved new workout plan", savedFullWorkoutPlan);
    // Update the user's `workouts` array with the reference to the full workout plan
    const foundUser = await UserModel.findById(user._id);
    console.log("the found user", foundUser);
    foundUser.workoutPlans.push(savedFullWorkoutPlan._id);
    console.log("The user after the push", foundUser);
    await foundUser.save();
  } catch (error) {
    console.trace(error);
  }
}

export { createWeeklyWorkoutPlan, createFullWorkoutPlan };
