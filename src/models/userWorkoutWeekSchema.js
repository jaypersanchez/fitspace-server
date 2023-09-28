import mongoose from "mongoose";

const userWorkoutWeekSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  weekNumber: {
    type: Number,
    required: true,
  },
  workoutsPerWeek: {
    type: Number,
    required: true,
  },
  complete: {
    type: Boolean,
    default: false,
  },
  workouts: [
    {
      day: {
        type: Number,
        required: true,
      },
      complete: {
        type: Boolean,
        default: false,
      },
      workoutType: {
        type: String,
      },
      exercises: [
        {
          exercise: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "exercises",
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
          weight: {
            type: Array,
            required: true,
          },
          reps: {
            type: Number,
            required: true,
          },
          sets: {
            type: Number,
            required: true,
          },
          setsCompleted: {
            type: Number,
            required: true,
          },
          videoUrl: {
            type: String,
            required: true,
          },
          complete: {
            type: Boolean,
            required: true,
            default: false,
          },
        },
      ],
    },
  ],
});

export default mongoose.model("UserWorkoutWeek", userWorkoutWeekSchema);
