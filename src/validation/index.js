import { body, header } from "express-validator";

const newUserValidation = [
  body("name")
    .exists()
    .isString()
    .isLength({ min: 3 })
    .withMessage("Name must be at least 3 chars long"),
  body("surname")
    .exists()
    .isString()
    .isLength({ min: 3 })
    .withMessage("Surname must be at least 3 chars long"),
  body("email").exists().isEmail().withMessage("Email must be valid"),
  body("password")
    .exists()
    .isString()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 chars long"),
  // body('role').exists().isString().isIn(['admin', 'user']).withMessage('Role must be admin or user')
];

const userLoginValidation = [
  body("email").exists().isEmail().withMessage("Email must be valid"),
  body("password")
    .exists()
    .isString()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 chars long"),
];
const tokenValidation = [
  header("accessToken")
    .exists()
    .isString()
    .withMessage("Access token must be a string"),
  header("refreshToken")
    .exists()
    .isString()
    .withMessage("Refresh token must be a string"),
];

export { newUserValidation, userLoginValidation, tokenValidation };
