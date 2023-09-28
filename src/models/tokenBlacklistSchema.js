import mongoose from "mongoose";

const tokenBlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiration: { type: Date, required: true },
  tokenType: { type: String, required: true, enum: ["access", "refresh"] },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("TokenBlacklist", tokenBlacklistSchema);
