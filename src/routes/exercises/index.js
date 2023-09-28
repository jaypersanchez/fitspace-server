import express from "express";
// import { userLogin, createUser, userInfo, deleteUser } from "../../controllers/users/index.js";
import {
  newUserValidation,
  tokenValidation,
  userLoginValidation,
} from "../../validation/index.js";
import verifyTokenMiddle from "../../middleware/verifyTokenMiddle.js";
import { exerciseController } from "../../controllers/exercise/index.js";
const exerciseRoute = express.Router();

exerciseRoute.post("/search", exerciseController.search);
exerciseRoute.post("/search/by-levels", exerciseController.searchByLevel);
exerciseRoute.post("/search/get-levels", exerciseController.getAllExerciseLevels);
//exerciseRoute.put("/plan", verifyTokenMiddle, exerciseController.createPlan)
exerciseRoute.put("/plan", exerciseController.createPlan);
exerciseRoute.post("/exercises", exerciseController.getExercises);


export { exerciseRoute };
