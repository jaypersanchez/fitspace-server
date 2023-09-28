import mongoose from "mongoose";
import exerciseModel from "../models/exerciseSchema.js";

const getAllExercises = async () => {
  console.log(`Get all exercises`);
  //const results = await exerciseModel.find();
  const results = await exerciseModel.find();
  // console.log(`Services.Exercises`, results);
  return results;
};

const getAllExerciseLevels = async () => {
      try {
        const distinctLevels = await Exercise.aggregate([
          {
            $group: {
              _id: null,
              distinctLevels: { $addToSet: '$level' },
            },
          },
          {
            $project: {
              _id: 0,
              distinctLevels: 1,
            },
          },
        ]);

        res.json(distinctLevels[0].distinctLevels);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
    }
}

const searchExercise = async (searchString) => {
  console.log("search initiated");

  // const results = await Exercise.find({
  //     $or: [
  //       { name: { $regex: new RegExp(searchString), $options: 'i' } },
  //       { muscleGroup: { $regex: new RegExp(searchString), $options: 'i' } }
  //     ]
  //   });
  //const results = await exerciseModel.find({ name: { $regex: searchString } });
  const results = await exerciseModel.find({ name: { $regex: searchString, $options: "i" } });
  console.log("search finished", results);

  return results;
};

export { searchExercise, getAllExercises,getAllExerciseLevels };
