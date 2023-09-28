import mongoose from "mongoose";

const currencySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // Currency code (e.g., "usd", "aed")
  name: { type: String, required: true }, // Currency name (e.g., "US Dollar", "Euro")
});
export default mongoose.model("currencies", currencySchema);
