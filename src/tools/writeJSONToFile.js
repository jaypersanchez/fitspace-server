import { writeFile } from "fs";

function writeJSONToFile(obj, filename) {
  writeFile(filename, JSON.stringify(obj, null, 2), (err) => {
    if (err) {
      console.error(err);
    }
  });
}

export { writeJSONToFile };
