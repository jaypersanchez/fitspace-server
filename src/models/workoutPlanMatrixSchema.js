import mongoose from "mongoose";

const gymTypeValues = ['smallGym', 'homeGym', 'commercialGym', 'crossfitGym'];
const workoutTypeValues = ['buildStrength', 'sizeHypertrophy', 'getRipped', 'overallFitnessCardio'];

const workoutPlanMatrixSchema = new mongoose.Schema({
  gymType: {
    type: String,
    enum: gymTypeValues,
    required: true,
  },
  workoutType: {
    type: String,
    enum: workoutTypeValues,
    required: true,
  },
  workoutTypeDescription: {
    type: String,  // No longer required
  },
  categoryKeywords: String,
});

const WorkoutPlanMatrix = mongoose.model('WorkoutPlanMatrix', workoutPlanMatrixSchema);

module.exports = WorkoutPlanMatrix;
