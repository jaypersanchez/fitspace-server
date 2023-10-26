// THIS FILE IS TEMPORARY AND TO BE REMOVED ONCE CORRECT IMPLEMENTATION IS DONE

import mongoose from "mongoose";
import Exercise from "../models/exerciseSchema.js";
import WorkoutTypesMatrix from "../models/workoutTypesMatrixSchema.js"
import userWorkoutWeekSchema from "../models/userWorkoutWeekSchema.js";
import UserModel from "../models/userSchema.js";
import { shuffleArray } from "../tools/shuffleArray.js";
import { isDateOlderThan16Years } from "../tools/dateCheck.js";
import userWorkoutTypesMatrixSchema from "../models/userWorkoutTypesMatrixSchema.js";
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
        /** THE EXERCISE OBJECT FED FROM PREVIOUS QUERIES **/
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

async function createFullWorkoutPlan(user) {
  try {
    const numberOfWeeks = 8;
    const workoutPlan = [];
    const exercisesPerDay = 5;

    const queryWorkoutCriteria = {
      gymType: user.gymType,
      workoutType: { $in: [user.gymGoal[0], user.gymGoal[1]] }
    };

    const workouts = await WorkoutTypesMatrix.find(queryWorkoutCriteria);
    const concatenatedKeywords = workouts.map(workout => workout.categoryKeywords).join('|');
    
    const query = {
      $and: [
        { categoryKeywords: { $regex: concatenatedKeywords, $options: 'i' } },
        { level: { $in: [user.level] } }
      ]
    };

    const exercises = await Exercise.find(query);
    const workoutDaysPerWeek = user.frequency;

    for (let week = 0; week < numberOfWeeks; week++) {
      const weeklyPlan = [];

      for (let day = 0; day < workoutDaysPerWeek; day++) {
        const dailyExercises = generateDailyExercises(exercises, exercisesPerDay);
        weeklyPlan.push({ day: day + 1, exercises: dailyExercises });
      }

      workoutPlan.push({ week: week + 1, days: weeklyPlan });
    }

    const currentDay = new Date();
    const userDoc = await UserModel.findOne({ email: user.email });

    if (!userDoc) {
      throw new Error('User not found');
    }

    for (const week of workoutPlan) {
      const weekData = { days: [] };

      for (const day of week.days) {
        const dayData = { exercises: [] };

        for (const exercise of day.exercises) {
          currentDay.setDate(currentDay.getDate() + 1);
          const exerciseData = { newday: currentDay, ...exercise };
          dayData.exercises.push(exerciseData);
        }

        weekData.days.push(dayData);
      }

      userDoc.workoutPlans.push(weekData);
    }

    await userDoc.save();
    console.log('Workout plan saved successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

function generateDailyExercises(exercises, exercisesPerDay) {
  
  const dailyExercises = [];
  const pullExercises = exercises.filter(exercise => exercise.category === 'pull');
  const pushExercises = exercises.filter(exercise => exercise.category === 'push');
  const otherExercises = exercises.filter(exercise => exercise.category !== 'pull' && exercise.category !== 'push');
  let randomExercise

  console.log(`otherExercises ${JSON.stringify(otherExercises)}::${otherExercises}`)

  for (let exercise = 0; exercise < exercisesPerDay; exercise++) {
    let exerciseCategory;
    
    // Check if the current day's category should be "pull" or "push" to alternate
    if (exercise % 2 === 0) {
      exerciseCategory = 'pull';
    } else {
      exerciseCategory = 'push';
    }

    //console.log(`exercise category ${exerciseCategory} for Exercise Day ${exercise}`)

    let availableExercises;
        
    // Choose exercises from the appropriate category
    if (exerciseCategory === 'pull') {
      availableExercises = pullExercises;
    } else {
      availableExercises = pushExercises;
    }

    // Remove the selected exercise from the category it belongs to
    
      availableExercises = availableExercises.concat(otherExercises);
      console.log(`exercise category ${exerciseCategory} for Exercise Day ${exercise}`)
      randomExercise = getRandomExercise(availableExercises);
     
      
    dailyExercises.push(randomExercise);
    
  }

  return dailyExercises;
}


function getRandomExercise(exercises) {
  const randomIndex = Math.floor(Math.random() * exercises.length);
  return exercises[randomIndex];
}

export { createWeeklyWorkoutPlan, createFullWorkoutPlan };
