import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exercise" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exercise" }],
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  age: { type: String },
  gender: { type: String, enum: ["male", "female"] },
  height: { type: String },
  weight: { type: String },
  steps: { type: Number },
  level: {
    type: String,
    enum: ["bg", "Kids", "adv"],
    default: "bg",
  },
  workoutRegularity: { type: String, enum: ["currently", "months", "years"] },
  gymGoal: { type: Array },
  gymType: {
    type: String,
    enum: ["homeGym", "commercialGym", "smallGym", "crossfitGym"],
  },
  frequency: { type: Number },
  caloriesBurned: [{ type: Number }],
  // customerId: { type: String, default: null },
  stripeId: {
    customerId: { type: String, default: null },
    setupId: { type: String, default: null },
    subscriptionId: { type: String, default: null },
  },
  trialPeriod: { type: Date, required: false },
  subscriptionStatus: { type: String, default: null },
  paymentSchedule: {
    type: String,
    enum: ["month", "year", "trial"],
    default: "trial",
  },
  paymentActive: { type: Boolean, default: false },
  //workoutPlans: { type: Array, default: []},
  workoutPlans: [
    {
      complete: {
        type: Boolean,
        default: false,
      },
      completed_date: {
        type: Date,
        default: null, // Default value is null
      },
      days: [
        {
          // Other fields specific to each day, if any
        },
      ],
    },
  ],
  registeredDate: { type: Date, default: Date.now, required: true },
  subscriptionDate: { type: Date, default: Date.now, required: false },
  nextPaymentSchedule: {
    type: Date,
    required: false,
  },
  isSubscriptionExpired: { type: Boolean, required: false, default: false },
  autoRenewal: { type: Boolean, required: false, default: false },
  stepTracker: [
    {
      date: { type: Date, required: true },
      steps: { type: Number, required: true },
    },
  ],
  coach: {
    type: Boolean,
    default: false,
  },
  coachProfile: {
    enabled: {
      type: Boolean,
      default: false,
    },
    visible: {
      type: Boolean,
      default: false,
    },
    // ... other coach profile details ...
  },
});

// To be used for used for the user lists / ranking
//needs to use a trad function because it uses "this" to reference the model
userSchema.static("findUsers", async function (query) {
  const total = await this.countDocuments(query);
  const users = await this.find(query.criteria)
    .limit(query.options.limit)
    .skip(query.options.skip)
    .sort(query.options.sort);
  return { total, users };
});

// Define a pre-save middleware to handle the "paymentSchedule" enum values
userSchema.pre("save", function (next) {
  if (this.paymentSchedule === "trial") {
    // Calculate the nextPaymentSchedule based on subscriptionDate + 7 days for "trial"
    this.nextPaymentSchedule = new Date(this.subscriptionDate);
    this.nextPaymentSchedule.setDate(this.nextPaymentSchedule.getDate() + 7);
  } else if (this.paymentSchedule === "month") {
    // Calculate the nextPaymentSchedule based on subscriptionDate + 30 days for "month"
    this.nextPaymentSchedule = new Date(this.subscriptionDate);
    this.nextPaymentSchedule.setDate(this.nextPaymentSchedule.getDate() + 30);
  } else if (this.paymentSchedule === "year") {
    // Calculate the nextPaymentSchedule based on subscriptionDate + 365 days for "year"
    this.nextPaymentSchedule = new Date(this.subscriptionDate);
    this.nextPaymentSchedule.setDate(this.nextPaymentSchedule.getDate() + 365);
  } else {
    // If paymentSchedule is not recognized, set nextPaymentSchedule to null
    this.nextPaymentSchedule = null;
  }
  next();
});

userSchema.pre("save", async function () {
  const newUser = this;
  const plainPW = newUser.password;
  if (newUser.isModified("password")) {
    const hash = await bcrypt.hash(plainPW, 10);
    newUser.password = hash;
  }
  return newUser;
});

userSchema.statics.checkCredentials = async function (email, plainPW) {
  console.log("EMAIL:", email);
  console.log("pw:", plainPW);
  //finds user by email
  //if user => compare PWs
  const user = await this.findOne({ email: email }).populate({
    path: "workoutPlans",
    populate: {
      path: "weeks",
      populate: { path: "workouts.exercises.exercise" },
    },
  });
  // const foundUser = await userModel.findById(user._id)

  if (user) {
    const passwordMatch = await bcrypt.compare(plainPW, user.password);
    if (passwordMatch) {
      return user;
    } else {
      return null;
    }
  } else {
    return undefined;
  }
};

userSchema.methods.toJSON = function () {
  const CurrentDoc = this;
  const userObject = CurrentDoc.toObject();
  delete userObject.password;
  //Doesn't affect the database just removes the mongoose version key from the response
  delete userObject.__v;
  return userObject;
};

export default mongoose.model("User", userSchema, "users");
