const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Hari4418@',
    database: 'userdb'
});

// Set up session middleware for login tracking
app.use(session({
    secret: 'your-secret-key', // Change this secret key for security
    resave: false,
    saveUninitialized: false
}));

// Handle registration
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    // Hash the password before saving
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('Error hashing password');
        }

        // Insert user into the database
        db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).send('Error saving user');
            }

            // On successful registration, store user info in session
            req.session.user = { id: result.insertId, name, email };

            // Return a success response and show profile button
            res.json({ success: true, message: 'Successfully registered!', user: req.session.user });
        });
    });
});

// Handle login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if the email exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).send('Invalid email or password');
        }

        // Compare password with the stored hash
        bcrypt.compare(password, results[0].password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(400).send('Invalid email or password');
            }

            // If successful login, store user info in session
            req.session.user = { id: results[0].id, name: results[0].name, email: results[0].email };

            // Return success and show profile button
            res.json({ success: true, message: 'Login successful!', user: req.session.user });
        });
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
