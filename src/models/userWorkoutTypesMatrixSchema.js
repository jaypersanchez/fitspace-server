import mongoose from "mongoose";

const gymTypeValues = ['smallGym', 'homeGym', 'commercialGym', 'crossfitGym'];
const workoutTypeValues = ['buildStrength', 'sizeHypertrophy', 'getRipped', 'overallFitnessCardio'];

const userWorkoutTypesMatrixSchema = new mongoose.Schema({
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

export default mongoose.model('UserWorkoutTypesMatrix', userWorkoutTypesMatrixSchema);
