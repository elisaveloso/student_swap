const express = require('express');
const mysql = require('mysql2/promise');
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


// Connect to the datbase
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '@RU7.aPA1N4k',
    database: 'studentswap',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//test connection to db
(async () => {
    try {
        // Perform a simple query to test the connection
        const [rows] = await db.query('SELECT 1');
        console.log('Database connection successful!');
    } catch (err) {
        console.error('Error connecting to the database:', err.message);
    }
})();

//Session setup
app.use(session({
    secret: '=PQ7$LK2mcAXqaLATRMDlRYI9CugLz+N',
    resave: false,
    saveUninitialized: true
}));

// Middleware so that the user variables and cartTotal are always available in the views
app.use((req, res, next) => {
    res.locals.cartTotal = req.session.cartTotal || 0; // Set cartTotal or 0 if not set
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

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let redirectValue = '/products';
    const query = 'SELECT * FROM users WHERE email = ? AND hashedPassword = ?';
    const values = [email, password];
    
    try{
        const [ results ] = await db.execute(query, values);
        
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

        //update the last login time and isOnline status
        const updateQuery = 'UPDATE users SET lastLogin = NOW(), isOnline = 1 WHERE email = ?';
        await db.execute(updateQuery, [email]);
        
        // Manually update the last login time in the user object used for the session
        user.lastLogin = new Date();
        req.session.user = user;
        //add cartTotal to the session
        req.session.cartTotal = 0;
        res.redirect(redirectValue);
    }
    catch(err) {
        console.error('Database error:', err);
        res.status(500).send('Internal server error');
    }
});

app.get('/logout', async (req, res) => {
    //update the isOnline status
    const updateQuery = 'UPDATE users SET isOnline = 0 WHERE email = ?';
    await db.execute(updateQuery, [req.session.user.email]);
    req.session.destroy();
    res.redirect('/');
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.post('/register', async (req, res) => {
    var password = generatePassword(); //generate a password for the user
    const { firstName, lastName, email, screenResolution, os } = req.body;
    
    width = screenResolution.width;
    height = screenResolution.height;

    //check if user already exists
    const queryCheck = 'SELECT * FROM users WHERE email = ?';
    try {
        const [results] = await db.execute(queryCheck, [email]);
            if (results.length > 0) {
                console.log('User already exists');
                res.render('register.ejs');
                return;
            }
            else {
                registerUser(firstName, lastName, email, password, width, height, os, res);
            }
    }
    catch(err) {
        console.error('Database error:', err);
        res.status(500).send('Internal server error');
    }
});


async function registerUser(firstName, lastName, email, password, width, height, os, res) {

    console.log('Registering user:', firstName, lastName, email, password, width, height, os);

    sendEmail(email , password, firstName, lastName);
    
    //sha512 the password before storing it in the database
    password = crypto.SHA512(password).toString(crypto.enc.Hex);
    console.log('Hashed password:', password)

    const query = 'INSERT INTO users (firstName, lastName, email, hashedPassword, width, height, operatingSystem) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [firstName, lastName, email, password, width, height, os];
    try{
        const [results] = await db.execute(query, values);
            console.log('User inserted:', results);
            res.redirect('/login');
    }
    catch(err) {
        console.error('Database error:', err);
        res.status(500).send('Internal server error');
    }
}

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
        to: "studentswap.reutlingen@gmail.com", //Only email that works with the demo mailtrap account, should be the 'email' variable in real scenario
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

app.get('/products', async (req, res) => {
    const query = 'SELECT * FROM products';
    try{

    const [ values ] = await db.execute(query);
        res.render('products.ejs', { products: values });
    }
    catch(err) {
        console.error('Database error:', err);
        res.status(500).send('Internal server error');
    }
});

app.post('/add-to-cart', isAuthenticated, async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.session.user.id;

    if (quantity < 1) {
        return res.sendStatus(400);
    }

    try {
        // Validate product existence
        const [product] = await db.execute('SELECT * FROM products WHERE id = ? AND quantity >= ?', [productId, quantity]);
        if (product.length === 0) {
            return res.status(400).json({ error: 'Product not available or insufficient stock.' });
        }

        // Check if user has an active cart
        const [cart] = await db.execute('SELECT id FROM carts WHERE userId = ?', [userId]);
        let cartId;
        if (cart.length === 0) {
            // Create a new cart if none exists
            const [result] = await db.execute('INSERT INTO carts (userId) VALUES (?)', [userId]);
            cartId = result.insertId;
        } else {
            cartId = cart[0].id;
        }

        // Check if the product is already in the cart
        const [cartItem] = await db.execute('SELECT * FROM cartItems WHERE cartId = ? AND productId = ?', [cartId, productId]);

        if (cartItem.length > 0) {
            // Update the quantity if it exists
            await db.execute(
                'UPDATE cartItems SET quantity = quantity + ? WHERE cartId = ? AND productId = ?',
                [quantity, cartId, productId]
            );
        } else {
            // Add the product to the cart
            await db.execute('INSERT INTO cartItems (cartId, productId, quantity) VALUES (?, ?, ?)', [cartId, productId, quantity]);
        }

        // Reduce stock in products table
        await db.execute('UPDATE products SET quantity = quantity - ? WHERE id = ?', [quantity, productId]);

        // Update cart total in session
        req.session.cartTotal = req.session.cartTotal + quantity;
        
        // Send totalQuantity back to the client
        res.status(200).json({ totalQuantity: req.session.cartTotal });
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
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

app.post('/set-password', async (req, res) => {
    const { password } = req.body;
    if (password.length < 9) {
        res.render('setPassword.ejs', {error: 'Password must be at least 9 characters long'});
    }
    else {
        const query = 'UPDATE users SET hashedPassword = ? WHERE email = ?';
        const values = [password, req.session.user.email];
        try {
            const [ results ] = await db.execute(query, values);
            console.log('Password set:', results);
            const updateQuery = 'UPDATE users SET needsToChangePassword = 0 WHERE email = ?';
            db.execute(updateQuery, [req.session.user.email]);
            console.log('needsToChangePassword updated to 0');
            res.redirect('/products');
        }
        catch(err) {
            console.error('Database error:', err);
            res.status(500).send('Internal server error');
        }
    }
});

app.get('/online-users', async (req, res) => {
    try {
        const [ rows ] = await db.execute('SELECT COUNT(*) AS onlineCount FROM users WHERE isOnline = TRUE');
        res.json({ onlineCount: rows[0].onlineCount });
    } catch (err) {
        console.error('Error fetching online users:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});