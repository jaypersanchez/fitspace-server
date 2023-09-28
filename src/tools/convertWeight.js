/**
 * Converts weight from kilograms to pounds or from pounds to kilograms.
 * @param {number} weight - The weight to be converted.
 * @param {string} type - The type of conversion to be performed. Must be 'kgToLb' to convert from kilograms to pounds, or 'lbToKg' to convert from pounds to kilograms.
 * @returns {number|string} - The converted weight, or the string 'Invalid type' if the type is not recognized.
 */

function convertWeight(weight, type) {
  if (type === "kgToLb") {
    // 1 kilogram is equal to 2.20462 pounds
    return weight * 2.20462;
  } else if (type === "lbToKg") {
    // 1 pound is equal to 0.453592 kilograms
    return weight * 0.453592;
  } else {
    return "Invalid type";
  }
}

export default convertWeight;
