/**
 * Calculates the number of calories burned during a certain activity.
 * @param {number} weight - The weight of the person (in pounds).
 * @param {number} metValue - The MET value of the activity.
 * @param {number} duration - The duration of the activity (in minutes).
 * @returns {number} - The number of calories burned during the activity.
 */

function calculateCaloriesBurned(weight, metValue, duration) {
  // Calculate the number of calories burned per minute
  const caloriesPerMinute = (metValue * 3.5 * weight) / 200;
  // Calculate the total number of calories burned by multiplying the calories per minute by the duration in minutes
  return caloriesPerMinute * duration;
}

export default calculateCaloriesBurned;
