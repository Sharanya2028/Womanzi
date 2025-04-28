const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');


const cors = require('cors');
const app = express();
const port = 8000;

app.use(bodyParser.json());
// app.use(express.static('haircare-public'));
app.use(express.static(path.join(__dirname, 'haircare-public')));

app.options('/recommended-product', cors());
app.use(cors({
  origin: '*', // Allow all origins (or specify your front-end origin for security)
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Set up database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Hari4418@',
  database: 'haircare_products'
});

db.connect((err) => {
  if (err) {
    console.log('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/haircare-public/index1.html');
});

// Generate combinations logic
const generateCombinations = (options) => {
  const keys = Object.keys(options);
  const result = [];

  const helper = (index, currentCombination) => {
    if (index === keys.length) {
      result.push(currentCombination);
      return;
    }

    const key = keys[index];
    const optionValues = options[key];

    for (const option of optionValues) {
      helper(index + 1, { ...currentCombination, [key]: option });
    }
  };

  helper(0, {});
  return result;
};

// Insert combinations into the database only once
const insertCombinationsIntoDB = async () => {
  const options = {
    hairType: ['Straight', 'Wavy'],
    hairThickness: ['Thin', 'Thick'],
    scalpFeel: ['Dry', 'Oily'],
    dandruff: ['Yes', 'No'],
    heatStyling: ['Rarely/Never', 'Regularly'],
    chemicalTreatments: ['Yes', 'No'],
    primaryConcern: ['Hair fall/Thinning', 'Frizz/Dryness'],
    washFrequency: ['Every day', '2-3 times a week or less'],
    naturalPreference: ['Yes', 'No preference'],
    hairCareGoal: ['Strengthen/Repair', 'Hydrate/Smooth']
  };

  // Generate all combinations
  const allCombinations = generateCombinations(options);
  console.log('Combinations to be inserted:', allCombinations.length);

  // Check if products are already inserted
  const [rows] = await db.promise().query('SELECT COUNT(*) AS count FROM products1');
  if (rows[0].count === 0) {
    console.log('No products found. Inserting new products...');
    // Insert each combination into the database
    for (const comb of allCombinations) {
      const product = {
        hairType: comb.hairType,
        hairThickness: comb.hairThickness,
        scalpFeel: comb.scalpFeel,
        dandruff: comb.dandruff,
        heatStyling: comb.heatStyling,
        chemicalTreatments: comb.chemicalTreatments,
        primaryConcern: comb.primaryConcern,
        washFrequency: comb.washFrequency,
        naturalPreference: comb.naturalPreference,
        hairCareGoal: comb.hairCareGoal,
        productName: 'Sample Hair Product' // Replace with actual product name
      };

      const query = `
        INSERT INTO products1 (hairType, hairThickness, scalpFeel, dandruff, heatStyling, chemicalTreatments, primaryConcern, washFrequency, naturalPreference, hairCareGoal, productName)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.promise().query(query, Object.values(product));
    }
  } else {
    console.log('Products already exist in the database. Skipping insertion.');
  }
};

// Ensure the insertion only happens once
insertCombinationsIntoDB();

// Define the route for recommending products
app.post('/recommended-product', async(req, res) => {
  const userAnswers = req.body; // This will contain the data from the front-end form
  
  try {
    console.log('User Answers:', userAnswers);  // Log the user answers from frontend
    // Construct the query based on userAnswers
    const query = `
      SELECT productName, description
      FROM products1
      WHERE hairType = ? AND 
            hairThickness = ? AND 
            scalpFeel = ? AND 
            dandruff = ? AND 
            heatStyling = ? AND 
            chemicalTreatments = ? AND 
            primaryConcern = ? AND 
            washFrequency = ? AND 
            naturalPreference = ? AND 
            hairCareGoal = ?
      LIMIT 1
    `;

    const values = [
      userAnswers.hairType,
      userAnswers.hairThickness,
      userAnswers.scalpFeel,
      userAnswers.dandruff,
      userAnswers.heatStyling,
      userAnswers.chemicalTreatments,
      userAnswers.primaryConcern,
      userAnswers.washFrequency,
      userAnswers.naturalPreference,
      userAnswers.hairCareGoal
    ];

    const [rows] = await db.promise().query(query, values);
    console.log('Database Query Result:', rows);  // Log the results from the database

    if (rows.length > 0) {
      res.json({ 
        product: rows[0].productName, 
        description: rows[0].description || 'No description available'
      });
    } else {
      res.json({ product: 'No matching product found', description: 'No description available' });
    }
  } catch (error) {
    console.error('Error recommending product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
//     console.log('User Answers:', userAnswers);

//     // Implement logic to recommend a product based on user answers
//     const recommendedProduct = "Sample Haircare Product"; // Replace with actual recommendation logic

//     res.json({ product: recommendedProduct });
// 
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });





