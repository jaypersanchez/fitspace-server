import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["pull", "push", "legs", "core", "kids"],
    required: true,
  },
  muscleGroup: [
    {
      type: String,
      required: true,
    },
  ],
  level: {
    type: String,
    required: true,
  },
  equipment: {
    type: String,
    required: false,
  },
  mets: {
    type: Number,
    required: true,
  },
  startingWeight: [
    {
      lbs: {
        type: Number,
        required: true,
      },
      kg: {
        type: Number,
        required: true,
      },
    },
  ],
  videoUrl: {
    type: String,
    required: true,
  },
});

export default mongoose.model("exercises", exerciseSchema);
