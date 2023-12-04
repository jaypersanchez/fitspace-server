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
    let exercisesPerDay

    if(user.level && user.level.toLowerCase() === 'kids') {
      exercisesPerDay = 4;
    }
    else {
      exercisesPerDay = 5;
    }

    console.log(`gymType ${user.gymType}`)
    const queryWorkoutCriteria = {
      gymType: user.gymType,
      workoutType: { $in: [user.gymGoal[0], user.gymGoal[1]] }
    };

    const workouts = await WorkoutTypesMatrix.find(queryWorkoutCriteria);
    const categoryKeywords = workouts.map(workout => workout.categoryKeywords);
    const muscleKeywords = workouts.flatMap(workout => workout.muscleGroup);

    
    const query = {
      level: user.level
    };
    const exercises = await Exercise.find(query);

    let workoutDaysPerWeek 
    if(user.level && user.level.toLowerCase() === 'kids') {
     workoutDaysPerWeek = 2
    }
    else {
      workoutDaysPerWeek = user.frequency;
    }
    console.log(`level ${user.level}::workoutdaysperweek ${workoutDaysPerWeek}::exercisesPerDay ${exercisesPerDay}`)
    /** 
     * Band aid fix to handle Kids level: 2 days workout per week and only 4 workout types per day
     * Have to override the settings above
     */
    /*if(user.level.toLowerCase() === 'Kids') {
      exercisesPerDay = 4
      //must be overriden because during onboarding, Kids level has no option for 2 days/week workout
      workoutDaysPerWeek = 2
    }*/

    for (let week = 1; week <= numberOfWeeks; week++) {
      const weeklyPlan = [];
      console.log(`Week ${week}\n`)
      
      for (let day = 1; day <= workoutDaysPerWeek; day++) {
        let dailyExercises;
    
        if (user.level && user.level.toLowerCase() === 'kids') {
          // For Kids level, generate daily exercises with the function for kids
          dailyExercises = generateDailyExercisesForKids(exercises, day);
        } else {
          // For other levels, use the existing function
          dailyExercises = generateDailyExercises(exercises, day, user);
        }
        
        console.log(`Day ${day}\n`)
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

// Function to generate daily exercises for kids
function generateDailyExercisesForKids(exercises, day) {
  // Calculate the index to start from based on the day
  const startIndex = (day - 1) * 4;
  
  // Calculate the index to end at based on the day
  const endIndex = startIndex + 4;
  
  // Check if we need to wrap around to the beginning of the list
  const wrapAround = endIndex > exercises.length;
  
  // Create an array to store the daily exercises
  const dailyExercises = [];
  
  // Add exercises to the daily list
  for (let i = startIndex; i < endIndex; i++) {
    if (i >= exercises.length) {
      // Wrap around to the beginning if necessary
      const wrappedIndex = i - exercises.length;
      dailyExercises.push(exercises[wrappedIndex]);
    } else {
      dailyExercises.push(exercises[i]);
    }
  }
  
  return dailyExercises;
}

/*
        Day 1 Leg: "isometric calf raise + calf raise" and then 2 pull exercises. 
        It should have 4 leg exercises and 1 cardio exercise.

        Day 2 Upper Body and Push Day. It has 4 cardio exercises and one push exercises.
        It should have 4 push exercises and 1 core exercise.

        Day 3 Upper Body and Pull Day. It has all random exercises it should have 4 pull exercises and one core exercise
        Day 4 Let Day. It has 4 cardio exercises and 1 push. It should have 4 leg exercises and one cardio.

        3 day split example
            Day 1- Lower, lower, lower, lower, cardio
            Day 2- push,push,push,push, core
            Day 3- Pull,Pull, Pull, Pull, core
            
            If there was 4 days it would be
            Day 4 lower, lower , lower , lower , cardio.
            Day 5 3 core exercises, 2 cardio exercises

            Kids exercises should be 2 workouts days per week, 4 random exercises each day.
            But they should not repeat until all exercises have been done at least 1x
*/
function generateDailyExercises(exercises, day, user) {

  let dailyExercises = [];
  let legExercises
  let pullExercises
  let pushExercises
  let coreExercise
  let upperBodyExercises
  console.log(`Generate plan for day ${day}`)

  if(user.level && user.level.toLowerCase() === 'kids') {
      //generate two days worth of workouts
  }

  if (day === 1) {

    /* adv and bg */
      /*Day 1 Leg: "isometric calf raise + calf raise" and then 2 pull exercises. 
      It should have 4 leg exercises and 1 cardio exercise.*/

      legExercises = exercises.filter(exercise => exercise.category === 'lower body');
      pullExercises = exercises.filter(exercise => exercise.category === 'pull');
      coreExercise = exercises.filter(exercise => exercise.category === 'core');

      /* 
      The Isometric only categorized and in musclegroup as lower body, legs and calves and only exist for level = adv
      */
      if (user.level === 'adv') {
        // Define an array to track selected exercise IDs
        const selectedExerciseIds = [];
      
        // Function to get a random exercise from the provided array while ensuring uniqueness
        const getRandomUniqueExercise = (exerciseArray) => {
          let randomExercise;
          do {
            randomExercise = getRandomExercise(exerciseArray);
          } while (selectedExerciseIds.includes(randomExercise._id));
          
          // Add the selected exercise's _id to the tracking array
          selectedExerciseIds.push(randomExercise._id);
          return randomExercise;
        };
      
        dailyExercises.push(exercises.find(exercise => exercise.name === 'Isometric calf raise + calf raise'));
        dailyExercises.push(getRandomUniqueExercise(pullExercises));
        dailyExercises.push(getRandomUniqueExercise(pullExercises));
        dailyExercises.push(getRandomUniqueExercise(coreExercise));
      } else {
        // Define an array to track selected exercise IDs
        const selectedExerciseIds = [];
      
        // Function to get a random exercise from the provided array while ensuring uniqueness
        const getRandomUniqueExercise = (exerciseArray) => {
          let randomExercise;
          do {
            randomExercise = getRandomExercise(exerciseArray);
          } while (selectedExerciseIds.includes(randomExercise._id));
      
          // Add the selected exercise's _id to the tracking array
          selectedExerciseIds.push(randomExercise._id);
          return randomExercise;
        };
      
        dailyExercises.push(getRandomUniqueExercise(pullExercises));
        dailyExercises.push(getRandomUniqueExercise(pullExercises));
        dailyExercises.push(getRandomUniqueExercise(pullExercises));
        dailyExercises.push(getRandomUniqueExercise(coreExercise));
      }
    
   
  } else if (day === 2) {

        /*Day 2 Upper Body and Push Day. It has 4 cardio exercises and one push exercises.
        It should have 4 push exercises and 1 core exercise.*/
        //NOTE: for both adv and bg, upper body does not exist in both category and muscle group.  Only in Kids level
        //So what would be considered upper body workout?
        pushExercises = exercises.filter(exercise => exercise.category === 'push');
        coreExercise = exercises.filter(exercise => exercise.category === 'core');

        // Define an array to track selected exercise IDs
        const selectedExerciseIds = [];

        // Function to get a random exercise from the provided array while ensuring uniqueness
        const getRandomUniqueExercise = (exerciseArray) => {
          let randomExercise;
          do {
            randomExercise = getRandomExercise(exerciseArray);
          } while (selectedExerciseIds.includes(randomExercise._id));

          // Add the selected exercise's _id to the tracking array
          selectedExerciseIds.push(randomExercise._id);
          return randomExercise;
        };

        // Add four random push exercises while ensuring uniqueness
        for (let i = 0; i < 4; i++) {
          dailyExercises.push(getRandomUniqueExercise(pushExercises));
        }

        // Add a random core exercise while ensuring uniqueness
        dailyExercises.push(getRandomUniqueExercise(coreExercise));
    

  } else if (day === 3) {

    /*
    Day 3 Upper Body and Pull Day. It has all random exercises it should have 4 pull exercises and one core exercise
    3 day split example
            Day 1- Lower, lower, lower, lower, cardio
            Day 2- push,push,push,push, core
            Day 3- Pull,Pull, Pull, Pull, core
    */

    // Day 3: Pull Day
    pullExercises = exercises.filter(exercise => exercise.category === 'pull');
    coreExercise = exercises.filter(exercise => exercise.category === 'core');
    
    // Add four random pull exercises
    dailyExercises.push(getRandomExercise(pullExercises));
    dailyExercises.push(getRandomExercise(pullExercises));
    dailyExercises.push(getRandomExercise(pullExercises));
    dailyExercises.push(getRandomExercise(pullExercises));
    dailyExercises.push(getRandomExercise(coreExercise));

  } else if (day === 4) {
    //Day 4 lower, lower , lower , lower , cardio.
    //NOTE there is no cardio that exist under category and muscleGroup
    legExercises = exercises.filter(exercise => exercise.category === 'lower body');
    coreExercise = exercises.filter(exercise => exercise.category === 'core');

    // Define an array to track selected exercise IDs
    const selectedExerciseIds = [];

    // Function to get a random exercise from the provided array while ensuring uniqueness
    const getRandomUniqueExercise = (exerciseArray) => {
      let randomExercise;
      do {
        randomExercise = getRandomExercise(exerciseArray);
      } while (selectedExerciseIds.includes(randomExercise._id));

      // Add the selected exercise's _id to the tracking array
      selectedExerciseIds.push(randomExercise._id);
      return randomExercise;
    };

    // Add four random leg exercises while ensuring uniqueness
    for (let i = 0; i < 4; i++) {
      dailyExercises.push(getRandomUniqueExercise(legExercises));
    }

    // Add a random core exercise while ensuring uniqueness
    dailyExercises.push(getRandomUniqueExercise(coreExercise));


  } else if (day === 5) {

      // Day 5: 3 core exercises, 2 cardio exercises
      coreExercise = exercises.filter(exercise => exercise.category === 'core');

      // Define an array to track selected exercise IDs
      const selectedExerciseIds = [];

      // Function to get a random exercise from the provided array while ensuring uniqueness
      const getRandomUniqueExercise = (exerciseArray) => {
        let randomExercise;
        do {
          randomExercise = getRandomExercise(exerciseArray);
        } while (selectedExerciseIds.includes(randomExercise._id));

        // Add the selected exercise's _id to the tracking array
        selectedExerciseIds.push(randomExercise._id);
        return randomExercise;
      };

      // Add 3 random core exercises while ensuring uniqueness
      for (let i = 0; i < 3; i++) {
        dailyExercises.push(getRandomUniqueExercise(coreExercise));
      }

      // Add 2 cardio exercises (assuming you have a cardio category)
      const cardioExercises = exercises.filter(exercise => exercise.category === 'cardio');
      // Check if there are enough cardio exercises available
      if (cardioExercises.length >= 2) {
        // If there are enough, add 2 random cardio exercises
        dailyExercises.push(getRandomExercise(cardioExercises));
        dailyExercises.push(getRandomExercise(cardioExercises));
      } else {
        // Handle the case when there are not enough cardio exercises
        console.log('Not enough cardio exercises available.');
        // You can choose to handle this case differently, e.g., by adding a default exercise.
      }
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
