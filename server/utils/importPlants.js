const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const chalk = require('chalk');

const setupDB = require('./db');
const Product = require('../models/product');
const Category = require('../models/category');

// Path to your CSV file
const CSV_FILE_PATH = './plant_data.csv';

// Function to import plant data from CSV
const importPlants = async () => {
  try {
    console.log(`${chalk.blue('✓')} ${chalk.blue('Plant data import started')}`);

    // Create indoor and outdoor categories if they don't exist
    const indoorCategory = await Category.findOne({ slug: 'indoor-plants' });
    const outdoorCategory = await Category.findOne({ slug: 'outdoor-plants' });

    let indoorCategoryId;
    let outdoorCategoryId;

    if (!indoorCategory) {
      const newIndoorCategory = new Category({
        name: 'Indoor Plants',
        description: 'Plants that thrive indoors with less direct sunlight',
        isActive: true,
        products: []
      });
      const savedIndoorCategory = await newIndoorCategory.save();
      indoorCategoryId = savedIndoorCategory._id;
      console.log(`${chalk.green('✓')} ${chalk.green('Indoor Plants category created')}`);
    } else {
      indoorCategoryId = indoorCategory._id;
      console.log(`${chalk.yellow('!')} ${chalk.yellow('Indoor Plants category already exists')}`);
    }

    if (!outdoorCategory) {
      const newOutdoorCategory = new Category({
        name: 'Outdoor Plants',
        description: 'Plants that thrive outdoors with more direct sunlight',
        isActive: true,
        products: []
      });
      const savedOutdoorCategory = await newOutdoorCategory.save();
      outdoorCategoryId = savedOutdoorCategory._id;
      console.log(`${chalk.green('✓')} ${chalk.green('Outdoor Plants category created')}`);
    } else {
      outdoorCategoryId = outdoorCategory._id;
      console.log(`${chalk.yellow('!')} ${chalk.yellow('Outdoor Plants category already exists')}`);
    }

    // Read and process CSV file
    const plants = [];
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        plants.push(row);
      })
      .on('end', async () => {
        console.log(`${chalk.green('✓')} ${chalk.green(`CSV file successfully processed. Found ${plants.length} plants.`)}`);

        // Process each plant
        for (const plant of plants) {
          try {
            // Determine category based on 'kategori' field
            const categoryId = plant.kategori.toLowerCase().includes('indoor') ? indoorCategoryId : outdoorCategoryId;

            // Check if plant already exists by name
            const existingPlant = await Product.findOne({ name: plant.nama_tanaman });

            if (existingPlant) {
              console.log(`${chalk.yellow('!')} ${chalk.yellow(`Plant "${plant.nama_tanaman}" already exists, skipping.`)}`);
              continue;
            }

            // Map difficulty level from CSV to enum values
            let difficultyLevel = 'Mudah'; // Default
            if (plant.tingkat_kesulitan) {
              if (plant.tingkat_kesulitan.toLowerCase().includes('sulit')) {
                difficultyLevel = 'Sulit';
              } else if (plant.tingkat_kesulitan.toLowerCase().includes('sedang')) {
                difficultyLevel = 'Sedang';
              }
            }

            // Map light requirements from CSV to enum values
            let lightRequirements = 'Sedang'; // Default
            if (plant.kebutuhan_cahaya) {
              if (plant.kebutuhan_cahaya.toLowerCase().includes('tinggi')) {
                lightRequirements = 'Tinggi';
              } else if (plant.kebutuhan_cahaya.toLowerCase().includes('rendah')) {
                lightRequirements = 'Rendah';
              }
            }

            // Process tags
            let tags = [];
            if (plant.tags) {
              tags = plant.tags.split(',').map(tag => tag.trim());
            }

            // Create new plant product with plant-specific fields
            const newPlant = new Product({
              sku: generateSKU(plant.nama_tanaman),
              name: plant.nama_tanaman,
              description: plant.deskripsi,
              quantity: 10, // Default quantity
              price: generateRandomPrice(10, 100), // Random price between 10 and 100
              taxable: true,
              isActive: true,
              difficultyLevel: difficultyLevel,
              lightRequirements: lightRequirements,
              tags: tags,
              category: categoryId
            });

            // Save the plant
            const savedPlant = await newPlant.save();

            // Add plant to the appropriate category
            await Category.updateOne(
              { _id: categoryId },
              { $push: { products: savedPlant._id } }
            );

            console.log(`${chalk.green('✓')} ${chalk.green(`Plant "${plant.nama_tanaman}" imported successfully.`)}`);
          } catch (error) {
            console.log(`${chalk.red('x')} ${chalk.red(`Error importing plant "${plant.nama_tanaman}": ${error.message}`)}`);
          }
        }

        console.log(`${chalk.blue('✓')} ${chalk.blue('Plant data import completed')}`);
        mongoose.connection.close();
      });
  } catch (error) {
    console.log(`${chalk.red('x')} ${chalk.red('Error while importing plant data')}`);
    console.log(error);
  }
};

// Helper function to generate a SKU from plant name
function generateSKU(plantName) {
  // Create a SKU based on the first 3 letters of the plant name + random alphanumeric
  const prefix = plantName.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${randomPart}`;
}

// Helper function to generate a random price
function generateRandomPrice(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Run the import
(async () => {
  try {
    await setupDB();
    await importPlants();
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
  }
})();
