import mongoose from "mongoose";

const gymTypeSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  name: String,
});

export default mongoose.model("gymtypes", gymTypeSchema);
