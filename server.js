const express = require('express');
const mysql = require('mysql2');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const session = require('express-session');
const crypto = require('crypto-js');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

firstLogin = false;

const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io",
    port: 587,
    auth: {
      user: "api",
      pass: "1b9d0b0b6486e638d63760720f120ace"
    }
});

// Create the connection to database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@RU7.aPA1N4k',
    database: 'studentswap'
});

db.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err);
      return;
    }
    console.log('Connected to MySQL database "' + db.config.database + '" at', db.config.host, 'as', db.config.user);
});

//Session setup
app.use(session({
    secret: '=PQ7$LK2mcAXqaLATRMDlRYI9CugLz+N',
    resave: false,
    saveUninitialized: true
}));

// Middleware so that the user variables are always available in the views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null; // Set user or null if not logged in
    next(); // Proceed to the next middleware or route handler
});

// Middleware to check if the user is logged in and otherwise redirect to login
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next(); // User is logged in, proceed to the next middleware or route handler
    }
    res.redirect('/login'); // Redirect to login page if not logged in
}

// Routes
app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/');
        return;
    }
    if (firstLogin) {
        res.render('login.ejs', {error: 'Check your email for your password'});
        firstLogin = false;
        return;
    }
    res.render('login.ejs', {error: ''});
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    redirectValue = '/products';
    const query = 'SELECT * FROM users WHERE email = ? AND hashedPassword = ?';
    const values = [email, password];
    db.execute(query, values, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return;
        }

        if (results.length === 0) {
            console.log('Login failed');
            res.render('login.ejs', { error: 'Invalid email or password' });
            return;
        }

        const user = results[0];
        console.log('Login successful:', user);

        if (user.needsToChangePassword === 1) {
            console.log('First login');
            redirectValue = '/set-password'
        }

        req.session.user = user;
        console.log(redirectValue);
        res.redirect(redirectValue);
    });
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.post('/register', (req, res) => {

    const { firstName, lastName, email, screenResolution, os } = req.body;
    
    width = screenResolution.width;
    height = screenResolution.height;

    console.log('Registering user:', firstName, lastName, email, password, width, height, os);

    var password = generatePassword(); 
    console.log('Generated password for user:', password);

    sendEmail(email , password, firstName, lastName);
    
    //sha512 the password before storing it in the database
    password = crypto.SHA512(password).toString(crypto.enc.Hex);
    console.log('Hashed password:', password)

    const query = 'INSERT INTO users (firstName, lastName, email, hashedPassword, width, height, operatingSystem) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [firstName, lastName, email, password, width, height, os];

    db.execute(query, values, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return;
        }
        console.log('Insert successful:', results);
        res.redirect('/login');
    });
});

function generatePassword() {
    //generate a password. nine characters long and contains at least one upper case letter, one lower case letter and one number.
    var password = "";
    var upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var lowerCase = "abcdefghijklmnopqrstuvwxyz";
    var numbers = "0123456789";
    var all = upperCase + lowerCase + numbers;
    for (var i = 0; i < 9; i++) {
        if (i == 0) {
            password += upperCase.charAt(Math.floor(Math.random() * upperCase.length));
        } else if (i == 1) {
            password += lowerCase.charAt(Math.floor(Math.random() * lowerCase.length));
        } else if (i == 2) {
            password += numbers.charAt(Math.floor(Math.random() * numbers.length));
        } else {
            password += all.charAt(Math.floor(Math.random() * all.length));
        }
    }
    return password;
}

function sendEmail(email, password, firstName, lastName) {
    //send an email to the user with the generated password
    var mailOptions = {
        from: 'studentswap@demomailtrap.com',
        to: email,
        subject: 'Welcome to StudentSwap!',
        text: `Hello ${firstName} ${lastName}! \nThank you for registering an account at StudentSwap!\nHere is your password that you should use to log in the first time: ${password}`
      };
      
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
}

app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile.ejs');
});

app.get('/checkout', (req, res) => {
    res.render('checkout.ejs');
}); 

app.get('/products', (req, res) => {
    res.render('products.ejs');
});

app.get('/confirmation', (req, res) => {
    res.render('confirmation.ejs');
});

app.get('/shoppingcart', (req, res) => {
    res.render('shoppingCart.ejs');
});

app.get('/set-password', (req, res) => {
    res.render('setPassword.ejs');
});

app.post('/set-password', (req, res) => {
    const { password } = req.body;
    if (password.length < 9) {
        res.render('setPassword.ejs', {error: 'Password must be at least 9 characters long'});
    }
    else {
        const query = 'UPDATE users SET hashedPassword = ? WHERE email = ?';
        const values = [password, req.session.user.email];
        db.execute(query, values, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return;
            }
            console.log('Password set:', results);
            const updateQuery = 'UPDATE users SET needsToChangePassword = 0 WHERE email = ?';
            db.execute(updateQuery, [req.session.user.email]);
            console.log('needsToChangePassword updated to 0');
            res.redirect('/products');
        });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});