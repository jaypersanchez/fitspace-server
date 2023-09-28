import mongoose from "mongoose";

const levelSchema = new mongoose.Schema({
  
  code: { type: String, required: true, unique: true }, // Level code (e.g., "adv", "bg", "Kids")
  name: { type: String, required: true }, // Currency name (e.g., "Advance", "Beginner", "Kids")

});
export default mongoose.model("levels", levelSchema);
