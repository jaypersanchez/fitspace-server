import mongoose from "mongoose";

// Define the schema for completed workout weeks
const completedWorkoutWeekSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Assuming userId is an ObjectId
    required: true,
  },
  completedDate: {
    type: Date,
    required: true,
  },
  weekData: {
    complete: {
      type: Boolean,
      default: false, // You can set the default value as needed
    },
    days: [
      {
        exercises: [
          // Define the structure of the exercises array here
          {
            _id: false, // This field should not have an ObjectId
            name: String,
            category: String,
            muscleGroup: [String],
            level: String,
            equipment: String,
            mets: Number,
            startingWeight: [
              {
                _id: false, // This field should not have an ObjectId
                lbs: Number,
                kg: Number,
              },
            ],
            videoUrl: String,
          },
        ],
      },
    ],
  },
});

// Create a model from the schema
export default mongoose.model('CompletedWorkoutWeek', completedWorkoutWeekSchema);
//const CompletedWorkoutWeek = mongoose.model('CompletedWorkoutWeek', completedWorkoutWeekSchema);

