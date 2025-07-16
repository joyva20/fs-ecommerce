# Plant Shop Migration Tools

This directory contains tools and documentation for migrating from a general e-commerce store to a plant shop.

## Files Overview

1. **importPlants.js** - Script to import plant data from CSV to MongoDB
2. **testScenarios.md** - Testing scenarios to ensure functionality after migration
3. **migrationGuide.md** - Comprehensive guide for migration, SEO, and branding

## How to Use the Import Script

The `importPlants.js` script imports plant data from a CSV file into your MongoDB database. It creates indoor and outdoor categories and associates plants with these categories based on the 'kategori' field in the CSV.

### Prerequisites

1. Node.js and npm installed
2. MongoDB connection configured in your .env file
3. CSV file with plant data in the following format:
   - nama_tanaman: Plant name
   - deskripsi: Plant description
   - tag: Plant tag
   - kategori: Category (indoor/outdoor)
   - tingkat_kesulitan: Difficulty level
   - kebutuhan_cahaya: Light requirements
   - tags: Comma-separated tags

### Installation

Install the required dependencies:

```bash
npm install csv-parser
```

### Usage

1. Place your CSV file at the root of the server directory and name it `plant_data.csv`
2. Run the script:

```bash
node server/utils/importPlants.js
```

### What the Script Does

1. Creates "Indoor Plants" and "Outdoor Plants" categories if they don't exist
2. Reads plant data from the CSV file
3. Maps CSV data to the product schema, including plant-specific fields
4. Saves plants to the database and associates them with the appropriate category

## Schema Modifications

The product schema has been modified to include plant-specific fields:

```javascript
// Plant-specific fields
difficultyLevel: {
  type: String,
  enum: ['Mudah', 'Sedang', 'Sulit'],
  default: 'Mudah'
},
lightRequirements: {
  type: String,
  enum: ['Rendah', 'Sedang', 'Tinggi'],
  default: 'Sedang'
},
tags: {
  type: [String],
  default: []
},
category: {
  type: Schema.Types.ObjectId,
  ref: 'Category'
}
```

## Testing

Refer to `testScenarios.md` for comprehensive testing scenarios to ensure all functionality works correctly after migration.

## Migration Guide

Refer to `migrationGuide.md` for best practices, SEO considerations, branding changes, potential issues, and documentation guidelines.

## Next Steps

After running the import script and testing the application:

1. Update the UI to display plant-specific information
2. Implement SEO and branding changes as outlined in the migration guide
3. Consider implementing the future enhancements suggested in the migration guide

## Troubleshooting

If you encounter issues with the import script:

1. Check that your CSV file is properly formatted
2. Ensure your MongoDB connection is configured correctly
3. Check the console for error messages
4. Make sure you have the required dependencies installed

If you need to revert the changes:

1. Restore your database from backup
2. Revert the product schema changes
3. Remove the indoor and outdoor categories