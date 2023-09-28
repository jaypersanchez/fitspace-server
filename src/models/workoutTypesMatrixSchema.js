import mongoose from "mongoose";

const workoutTypesMatrixSchema = new mongoose.Schema({
  gymType: {
    type: String,
    required: true,
  },
  workoutType: {
    type: String,
    required: true,
  },
  workoutTypeDescription: {
    type: String,
    required: true,
  },
  categoryKeywords: {
    type: String,
    required: true,
  },
});

export default mongoose.model('WorkoutTypesMatrix', workoutTypesMatrixSchema);