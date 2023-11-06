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
    console.log(`gymType ${user.gymType}`)
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

    for (let week = 1; week <= numberOfWeeks; week++) {
      const weeklyPlan = [];
      console.log(`Week ${week}\n`)
      /*
        Day 1 Leg: "isometric calf raise + calf raise" and then 2 pull exercises. It should have 4 leg exercises and 1 cardio exercise.
        Day 2 Upper Body and Push Day. It has 4 cardio exercises and one push exercises, it should have 4 push exercises and 1 core exercise.
        Day 3 Upper Body and Pull Day. It has all random exercises it should have 4 pull exercises and one core exercise
        Day 4 Let Day. It has 4 cardio exercises and 1 push. It should have 4 leg exercises and one cardio.
      */
      for (let day = 1; day <= workoutDaysPerWeek; day++) {
        //const dailyExercises = generateDailyExercises(exercises, exercisesPerDay);
        const dailyExercises = generateDailyExercises(exercises, day);
        console.log(`Day ${day}\n`)

          // Iterate through the daily exercises and print details
        dailyExercises.forEach((exercise, index) => {
          console.log(`Exercise ${JSON.stringify(exercise)}\n`)
            //let exerciseobj = JSON.parse(exercise)

            //console.log(`Exercise ${index + 1}:`);
            //console.log(`Name: ${exerciseobj.name}`);
            //console.log(`Category: ${exerciseobj.category}`);
            //console.log(`Level: ${exerciseobj.level}`);
            //console.log(`Muscle Group: ${exercise.muscleGroup.join(', ')}`);
            //console.log(`Equipment: ${exercise.equipment}`);
            //console.log(`Mets: ${exercise.mets}`);
            // Print other exercise details as needed
          
        });
        weeklyPlan.push({ day: day, exercises: dailyExercises });
      }

      workoutPlan.push({ week: week, days: weeklyPlan });
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



/*
  Day 1 Leg: "isometric calf raise + calf raise" and then 2 pull exercises. It should have 4 leg exercises and 1 cardio exercise.
  Day 2 Upper Body and Push Day. It has 4 cardio exercises and one push exercises, it should have 4 push exercises and 1 core exercise.
  Day 3 Upper Body and Pull Day. It has all random exercises it should have 4 pull exercises and one core exercise
  Day 4 Let Day. It has 4 cardio exercises and 1 push. It should have 4 leg exercises and one cardio.
*/
function generateDailyExercises(exercises, day) {
  const dailyExercises = [];
  console.log(`Generate plan for day ${day}`)
  if (day === 1) {
    // Day 1: Leg Day
    const legExercises = exercises.filter(exercise => exercise.category === 'lower body');
    const pullExercises = exercises.filter(exercise => exercise.category === 'pull');
    
    // Add two specific leg exercises
    dailyExercises.push(exercises.find(exercise => exercise.name === 'Isometric calf raise + calf raise'));
    //dailyExercises.push(exercises.find(exercise => exercise.name === 'calf raise'));
    
    // Add two random leg exercises
    dailyExercises.push(getRandomExercise(legExercises));
    dailyExercises.push(getRandomExercise(legExercises));
    
    // Add one cardio exercise
    dailyExercises.push(getRandomCardioExercise(exercises));
  } else if (day === 2) {
    // Day 2: Push Day
    const pushExercises = exercises.filter(exercise => exercise.category === 'push');
    const coreExercise = getRandomExercise(exercises, 'core');
    
    // Add four random push exercises
    dailyExercises.push(getRandomExercise(pushExercises));
    dailyExercises.push(getRandomExercise(pushExercises));
    dailyExercises.push(getRandomExercise(pushExercises));
    dailyExercises.push(getRandomExercise(pushExercises));
    
    // Add one core exercise
    dailyExercises.push(coreExercise);
  } else if (day === 3) {
    // Day 3: Pull Day
    const pullExercises = exercises.filter(exercise => exercise.category === 'pull');
    const coreExercise = getRandomExercise(exercises, 'core');
    
    // Add four random pull exercises
    dailyExercises.push(getRandomExercise(pullExercises));
    dailyExercises.push(getRandomExercise(pullExercises));
    dailyExercises.push(getRandomExercise(pullExercises));
    dailyExercises.push(getRandomExercise(pullExercises));
    
    // Add one core exercise
    dailyExercises.push(coreExercise);
  } else if (day === 4) {
    // Day 4: Leg Day
    const legExercises = exercises.filter(exercise => exercise.category === 'lower body');
    const pushExercises = exercises.filter(exercise => exercise.category === 'push');
    const coreExercise = getRandomExercise(exercises, 'core');
    
    dailyExercises.push(getRandomExercise(legExercises));
    dailyExercises.push(getRandomExercise(legExercises));
    dailyExercises.push(getRandomExercise(legExercises));
    dailyExercises.push(getRandomExercise(legExercises));
    dailyExercises.push(getRandomCardioExercise(exercises));
  } else if (day === 5) {
    // Repeating Day 3: Leg Day
    const pullExercises = exercises.filter(exercise => exercise.category === 'pull');
    const coreExercise = getRandomExercise(exercises, 'core');
    
    // Add four random pull exercises
    dailyExercises.push(getRandomExercise(pullExercises));
    dailyExercises.push(getRandomExercise(pullExercises));
    dailyExercises.push(getRandomExercise(pullExercises));
    dailyExercises.push(getRandomExercise(pullExercises));
    
    // Add one core exercise
    dailyExercises.push(coreExercise);
  }

  return dailyExercises;
}


function getRandomExercise(exercises) {
  const randomIndex = Math.floor(Math.random() * exercises.length);
  return exercises[randomIndex];
}

function getRandomCardioExercise(exercises) {
  const cardioExercises = exercises.filter(exercise => exercise.category === 'cardio');
  return getRandomExercise(cardioExercises);
}

// Example usage
/*const day1Exercises = generateDailyExercises(exercises, 1);
const day2Exercises = generateDailyExercises(exercises, 2);
const day3Exercises = generateDailyExercises(exercises, 3);
const day4Exercises = generateDailyExercises(exercises, 4);*/



/************ ORIGNAL DON NOT DELTE **************************/
function generateDailyExercisesxx(exercises, exercisesPerDay) {
  
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




export { createWeeklyWorkoutPlan, createFullWorkoutPlan };
