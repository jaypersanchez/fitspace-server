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
    // Define the number of weeks for 2 months
    const numberOfWeeks = 8;
    // Create an array to store the weekly workout plans
    let weeklyPlans = [];
    const daysPerWeek = user.frequency;
    const exercisesPerDay = 5; //standard these are three different types of exercises within a session.
    const workoutPlan = [];

    //console.log(`${user.gymType}::${user.gymGoal}::${user.level}::${user.frequency}`)
    //get the category keywords based on the gym type and workout type
    //console.log(`workoutType ${JSON.stringify(user.gymGoal[0])}::${user.gymType}::${user._id}`)
    const queryWorkoutCriteria = {
      gymType:user.gymType, 
      workoutType: {
        $in: [user.gymGoal[0], user.gymGoal[1]]
      }
    }
    //console.log(queryWorkoutCriteria)
    
    WorkoutTypesMatrix
    .find(queryWorkoutCriteria)
    .then(workouts => {
      //console.log(`workouts ${workouts}`)
      const concatenatedKeywords = workouts.map(workout => workout.categoryKeywords).join('|');
      //console.log("Concatenated Keywords:", concatenatedKeywords);
      const query = {
        $and: [
          {
            category: {
              $regex: concatenatedKeywords,
              $options: 'i',
            }
          },
          {
            level: {
              $in: [user.level]
            }
          }
        ]
      }//query
      Exercise.find(query)
      .then(exercises => {
        //console.log("Exercises:", exercises);
        // Handle the retrieved exercises
        return exercises
      })
      .then(exercises => {
        // Number of workout days per week
        const workoutDaysPerWeek = user.frequency;
        // Number of different exercises per workout day
        const exercisesPerDay = 5; //by default
        // Number of weeks
        const numberOfWeeks = 8; //by default
        
        //Generate workout plan
        for (let week = 0; week < numberOfWeeks; week++) {
          const weeklyPlan = [];
          for (let day = 0; day < workoutDaysPerWeek; day++) {
            const dailyExercises = [];
            for (let exercise = 0; exercise < exercisesPerDay; exercise++) {
              const randomExercise = getRandomExercise(exercises);
              dailyExercises.push(randomExercise);
            }
            weeklyPlan.push({ day: day + 1, exercises: dailyExercises });
          }
          workoutPlan.push({ week: week + 1, days: weeklyPlan });
        }
          //console.log(`WORKOUTPLAN ${JSON.stringify(workoutPlan)}`)
          return workoutPlan
      })
      .then(workoutPlan => {
        let currentDay = new Date();
        // Step 1: Fetch the user document
        UserModel.findOne({email: user.email})
        .then(user => {
          if (!user) {
            throw new Error('User not found');
          }

          // Step 2: Add the generated workout plan to the workoutPlans array
          //user.workoutPlans.push(...workoutPlan);
          for (const week of workoutPlan) {
            const weekData = { days: [] };
          
            for (const day of week.days) {
              const dayData = { exercises: [] };
          
              for (const exercise of day.exercises) {
                // You can process each exercise and its data here
                // For now, let's assume exerciseData is the processed exercise data
                let newday = currentDay.setDate(currentDay.getDate()+1)
                const exerciseData = { newday, ...exercise }; // Copy the exercise data
                dayData.exercises.push(exerciseData);
                //console.log(`Exercise WEEK ${JSON.stringify(week.week)}::DAY ${JSON.stringify(day.day)}`)
                //console.log(`exercises ${JSON.stringify(exercise)}`)
                //console.log("\n")

              }
          
              weekData.days.push(dayData);
              //console.log(`Weekly Exercises ${JSON.stringify(weekData)}`)
              //console.log("\n")
            }
          
            user.workoutPlans.push(weekData);
            //console.log(`user.workoutPlans ${JSON.stringify(user.workoutPlans)}`)
          }

          // Step 3: Save the modified user document
          return user.save();
        })
        .then(savedUser => {
          console.log('Workout plan saved successfully:', savedUser);
        })
        .catch(error => {
          console.error('Error:', error);
          // Handle errors
        });
      })
      .catch(error => {
        console.error("Error:", error);
        // Handle errors
      });
    })
    .catch(error => {
      console.error("Error:", error);
      console.trace(error);
    });
    
  } catch (error) {
    console.trace(error);
  }
}

function getRandomExercise(exercises) {
  const randomIndex = Math.floor(Math.random() * exercises.length);
  return exercises[randomIndex];
}

export { createWeeklyWorkoutPlan, createFullWorkoutPlan };
