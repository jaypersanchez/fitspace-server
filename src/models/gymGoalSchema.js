import mongoose from "mongoose";

const gymGoalSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  name: String,
});

export default mongoose.model("gymgoals", gymGoalSchema);
