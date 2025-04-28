const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;
// Set up middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'));
app.options('/recommend-product', cors());
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
  database: 'skincare_products'
});
db.connect((err) => {
  if (err) {
    console.log('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to the database');
});

// // Clear products table (optional)
// const clearProductsTable = async () => {
//   try {
//     await db.promise().query('DELETE FROM products');
//     await db.promise().query('ALTER TABLE products AUTO_INCREMENT = 1');
//     console.log('Products table cleared.');
//   } catch (error) {
//     console.error('Error clearing products table:', error);
//   }
// };

// // Clear the table before inserting new data
// clearProductsTable();

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
    skinType: ['Oily', 'Dry', 'Combination'],
    sensitiveSkin: ['Yes', 'No'],
    ageGroup: ['Under 20', '20-30'],
    acne: ['Yes', 'No'],
    primaryConcern: ['Anti-aging', 'Moisturizing'],
    darkCircles: ['Yes', 'No'],
    sunscreenUsage: ['Yes', 'No'],
    naturalProducts: ['Yes', 'No'],
    evenSkinTone: ['Yes', 'No'],
    moisturizingFrequency: ['Once a day', 'Twice a day']
  };

  // Generate all combinations
  const allCombinations = generateCombinations(options);
  console.log('Combinations to be inserted:', allCombinations.length);

  // Check if products are already inserted
  const [rows] = await db.promise().query('SELECT COUNT(*) AS count FROM products');
  if (rows[0].count === 0) {
    console.log('No products found. Inserting new products...');
    // Insert each combination into the database
    for (const comb of allCombinations) {
      const product = {

        skinType: comb.skinType,
        sensitiveSkin: comb.sensitiveSkin,
        ageGroup: comb.ageGroup,
        acne: comb.acne,
        primaryConcern: comb.primaryConcern,
        darkCircles: comb.darkCircles,
        sunscreenUsage: comb.sunscreenUsage,
        naturalProducts: comb.naturalProducts,
        evenSkinTone: comb.evenSkinTone,
        moisturizingFrequency: comb.moisturizingFrequency,
        productName: 'Sample Product' // Replace with actual product name
      };

      const query = `
        INSERT INTO products ( skinType, sensitiveSkin, ageGroup, acne, primaryConcern, darkCircles, sunscreenUsage, naturalProducts, evenSkinTone, moisturizingFrequency,productName)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.promise().query(query, Object.values(product));
      // console.log('Inserted product:', product);
    }
  } else {
    console.log('Products already exist in the database. Skipping insertion.');
  }
};

// Ensure the insertion only happens once
insertCombinationsIntoDB();

// Define the route for recommending products
app.post('/recommend-product', async(req, res) => {
  const userAnswers = req.body; // This will contain the data from the front-end form
  
  try {
    // Construct the query based on userAnswers
    const query = `
      SELECT productName, description
      FROM products 
      WHERE skinType = ? AND 
            sensitiveSkin = ? AND 
            ageGroup = ? AND 
            acne = ? AND 
            primaryConcern = ? AND 
            darkCircles = ? AND 
            sunscreenUsage = ? AND 
            naturalProducts = ? AND 
            evenSkinTone = ? AND 
            moisturizingFrequency = ?
      LIMIT 1
    `;

    const values = [
      userAnswers.skinType,
      userAnswers.sensitiveSkin,
      userAnswers.ageGroup,
      userAnswers.acne,
      userAnswers.primaryConcern,
      userAnswers.darkCircles,
      userAnswers.sunscreenUsage,
      userAnswers.naturalProducts,
      userAnswers.evenSkinTone,
      userAnswers.moisturizingFrequency
    ];

    const [rows] = await db.promise().query(query, values);
    

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
});

//   console.log('User Answers:', userAnswers);

//   // Implement your logic to recommend a product based on user answers
//   // For simplicity, let's just return a sample product for now
//   const recommendedProduct = "Sample Product"; // Replace this with actual recommendation logic

//   res.json({ product: recommendedProduct }); // Send the product back to the front-end
// });

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
