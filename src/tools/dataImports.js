import fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

// Prisma client
const prisma = new PrismaClient();

// CSV file path
const csvFilePath = 'C:\\Users\\jaypersanchez\\Dropbox\\PC\\Downloads\\gofit.exercises.csv';

// Function to insert data into the PostgreSQL table
async function insertExercisesData() {
  try {
    // Read the CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', async (row) => {
        // Map CSV columns to Prisma model fields
        const exerciseData = {
          name: row.name,
          category: row.category,
          muscle_group: [row.muscleGroup[0], row.muscleGroup[1], row.muscleGroup[2]],
          level: row.level,
          equipment: row.equipment,
          mets: parseFloat(row.mets),
          starting_weight_lbs: parseFloat(row['startingWeight.lbs']),
          starting_weight_kg: parseFloat(row['startingWeight.kg']),
          video_url: row.videoUrl,
          starting_weight: row.starting_weight,
        };

        // Insert data into the "exercises" table
        await prisma.exercises.create({
          data: exerciseData,
        });
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
      });
  } catch (error) {
    console.error('Error inserting data:', error);
  } finally {
    await prisma.$disconnect(); // Disconnect from the database
  }
}

// Call the function to insert data
insertExercisesData();
