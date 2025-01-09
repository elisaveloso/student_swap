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

// Middleware so that the user variables and cart are always available in the views
app.use((req, res, next) => {
    res.locals.cart = req.session.cart || null; // Set cart or null if not set
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
    console.log('Login:', email, password);
    let redirectValue = '/';
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
            //create a cart for the user
            const [result] = await db.execute('INSERT INTO carts (userId) VALUES (?)', [user.id]);
            req.session.cart = { quantity: 0, items: [], totalPrice: 0 };
            req.session.cart.id = result.insertId;
            firstLogin = true;

            redirectValue = '/set-password'
        }

        //update the last login time and isOnline status
        const updateQuery = 'UPDATE users SET lastLogin = NOW(), isOnline = 1 WHERE email = ?';
        await db.execute(updateQuery, [email]);
        
        // Manually update the last login time in the user object used for the session
        user.lastLogin = new Date();
        req.session.user = user;
        //check if there are items in the cart for that user and assing them to the session
        const userId = user.id;
        const [cart] = await db.execute('SELECT * FROM carts WHERE userId = ?', [userId]);
        req.session.cart = { quantity: 0, items: [], totalPrice: 0 };
        req.session.cart.quantity = await getQuantities();
        req.session.cart.id = cart[0].id;
        req.session.cart.totalPrice = await getTotalPrice(req.session.cart.id);
        console.log('Cart:', req.session.cart);

        res.redirect(redirectValue);
    }
    catch(err) {
        console.error('Database error:', err);
        res.status(500).send('Internal server error');
    }
});

app.get('/logout', isAuthenticated, async (req, res) => {
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

app.get('/set-password', isAuthenticated, (req, res) => {
    res.render('setPassword.ejs');
});

app.post('/set-password', isAuthenticated, async (req, res) => {
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

async function registerUser(firstName, lastName, email, password, width, height, os, res) {

    console.log('Registering user:', firstName, lastName, email, password, width, height, os);

    sendRegistrationEmail(email , password, firstName, lastName);
    
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

function sendRegistrationEmail(email, password, firstName, lastName) {
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

        // Update cart quantity in session
        req.session.cart.quantity = req.session.cart.quantity + quantity;
        
        // Send totalQuantity back to the client
        res.status(200).json({ totalQuantity: req.session.cart.quantity });
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.get('/cart', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const [cart] = await db.execute('SELECT * FROM carts WHERE userId = ?', [userId]);
    if (cart.length === 0) {
        return res.render('cart.ejs', { cartItems: [], totalPrice: 0 });
    }

    const cartId = cart[0].id;
    let [cartItems] = await db.execute('SELECT * FROM cartItems WHERE cartId = ?', [cartId]);

    for (let item of cartItems) {
        let [product] = await db.execute('SELECT * FROM products WHERE id = ?', [item.productId]);
        item.product = product[0];
        item.discount = await getDiscount(item.quantity);
        item.discountPercentage = Math.round((1 - item.discount) * 100); // Calculate discount percentage
        item.product.price = item.product.price * item.discount;
    }

    let totalPrice = 0;
    for (let item of cartItems) {
        totalPrice += item.product.price * item.quantity;
    }

    for (let item of cartItems) {
        let [product] = await db.execute('SELECT quantity FROM products WHERE id = ?', [item.productId]);
        item.product.stock = product[0].quantity;
    }

    cartItems = cartItems.map((item) => {
        return {
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            stock: item.product.stock,
            price: item.product.price,
            total: (item.product.price * item.quantity).toFixed(2),
            discountPercentage: item.discountPercentage // Include discount percentage
        };
    });

    req.session.cart.items = cartItems;
    req.session.cart.totalPrice = totalPrice.toFixed(2);
    req.session.cart.quantity = await getQuantities();

    res.render('cart.ejs', { cartItems, totalPrice: totalPrice.toFixed(2) });
});

app.post("/update-cart", isAuthenticated, async (req, res) => {
    const { itemId, quantity } = req.body;

    try {
        const [product] = await db.execute("SELECT price, quantity FROM products WHERE id = ?", [itemId]);

        if (!product || quantity > product[0].quantity) {
            return res.status(400).json({ error: "Invalid quantity" });
        }

        const discount = await getDiscount(quantity);
        const itemPrice = product[0].price * discount;
        const itemTotal = parseFloat(itemPrice * quantity).toFixed(2);
        const discountPercentage = Math.round((1 - discount) * 100); // Calculate discount percentage
        console.log("Item total:", itemTotal);

        await db.execute("UPDATE cartItems SET quantity = ? WHERE productId = ?", [quantity, itemId]);

        const cartId = req.session.cart.id;
        req.session.cart.totalPrice = await getTotalPrice(cartId);
        console.log("Total price:", req.session.cart.totalPrice);
        req.session.cart.quantity = await getQuantities();

        req.session.cart.items = req.session.cart.items.map((item) => {
            if (item.id === itemId) {
                item.quantity = quantity;
                item.total = itemTotal;
                item.discountPercentage = discountPercentage; // Update discount percentage
                item.price = itemPrice; // Update item price
            }
            return item;
        });

        res.json({ itemTotal, itemPrice, totalCartPrice: req.session.cart.totalPrice, totalQuantity: req.session.cart.quantity, discountPercentage });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/update-cart-quantity", isAuthenticated, async (req, res) => {
    totalQuantity = await getQuantities();
    res.json({ totalQuantity });
});

async function getTotalPrice(cartId) {
    try {
        const [cartItems] = await db.execute(
            "SELECT * FROM cartItems WHERE cartId = ?", [cartId]
        );
        console.log("Cart items:", cartItems);
        let totalCartPrice = 0;
        for (let item of cartItems) {
            // Get the price and quantity of the product
            const [product] = await db.execute("SELECT price FROM products WHERE id = ?", [item.productId]);
            item.price = product[0].price;

            // Apply the discount
            const discount = await getDiscount(item.quantity);
            const discountedPrice = item.price * discount;

            console.log(`Item quantity: ${item.quantity}, Original price: ${item.price}, Discounted price: ${discountedPrice}`);
            totalCartPrice += item.quantity * discountedPrice;
        }
        console.log("Total price:", totalCartPrice);
        return totalCartPrice.toFixed(2);
    } catch (error) {
        console.error("Error calculating total price:", error);
        throw error;
    }
}

app.post("/remove-from-cart", isAuthenticated, async (req, res) => {
    const { itemId } = req.body;

    try {
        // Remove the item from the cart in the database
        await db.execute("DELETE FROM cartItems WHERE productId = ?", [itemId]);        

        // Recalculate the total cart price
        req.session.cart.totalPrice = await getTotalPrice(req.session.cart.id);

        // Update the cart quantity in the session
        req.session.cart.quantity = await getQuantities();

        console.log("Total price:", req.session.cart.totalPrice);
        console.log("Total quantity:", req.session.cart.quantity);
        res.json({ totalCartPrice: req.session.cart.totalPrice || 0, totalQuantity: req.session.cart.quantity });
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

async function getQuantities(){
    // Get all items in cart and add quantities up:
    const [cartItems] = await db.execute("SELECT * FROM cartItems");
    let totalQuantity = 0;
    for (let item of cartItems) {
        totalQuantity += item.quantity;
    }

    return totalQuantity;
}

async function getDiscount(quantity) {
    let discount = 1;
    console.log("Quantity disc1", quantity);
    parseInt(quantity);
    console.log("Quantity disc2:", quantity);
    if (quantity >= 8 && quantity < 16) {
        discount = 0.92; // 8% discount
    } else if (quantity >= 16) {
        discount = 0.84; // 16% discount
    }
    return discount;
}
app.get('/checkout', isAuthenticated, (req, res) => {
    if (req.session.cart.items.length === 0) {
        return res.redirect('/cart');
    }

    const cartItems = req.session.cart.items;
    const totalPrice = req.session.cart.totalPrice;
    res.render('checkout.ejs', { cartItems, totalPrice });

});

app.post('/go-to-checkout', isAuthenticated, async (req, res) => {
    if (req.session.cart.items.length === 0) {
        return res.redirect('/cart');
    }
    res.redirect('/checkout');
});

app.post('/order', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const cart = req.session.cart;
    const cartItems = cart.items;
    let totalPrice = cart.totalPrice;

    const { shippingMethod } = req.body;
    console.log('Order:', userId, cart, totalPrice, shippingMethod);
    const validShippingMethods = {
        'DPD': 11,
        'DHL': 30,
        'DHL Express': 74
    };

    // Check if the provided shipping method is valid
    if (!validShippingMethods.hasOwnProperty(shippingMethod)) {
        return res.status(400).send('Invalid shipping method');
    }

    // Calculate the total price on the server side
    const shippingCost = validShippingMethods[shippingMethod]; // Get the shipping cost
    const subtotal = totalPrice // Subtotal is already calculated in the session, but without shipping cost
    totalPrice = subtotal + shippingCost;

    req.session.shippingCost = shippingCost;

    try {
        // Create an order
        const [order] = await db.execute('INSERT INTO orders (userId, totalAmount, shippingCost) VALUES (?, ?, ?)', [userId, totalPrice, shippingCost]);
        const orderId = order.insertId;

        // Create order items
        for (let item of cartItems) {
            await db.execute('INSERT INTO orderItems (orderId, productId, quantity, priceAtPurchase) VALUES (?, ?, ?, ?)', [orderId, item.id, item.quantity, item.price]);
        }

        // Clear the cart
        await db.execute('DELETE FROM cartItems WHERE cartId = ?', [cart.id]);

        // Update the product quantities
        for (let item of cartItems) {
            await db.execute('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.id]);
        }

        await sendOrderConfirmation(req.session.user.email, orderId, cartItems, totalPrice, shippingCost);

        res.redirect('/confirmation');

    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).send('Internal server error');
    }
});

app.get('/orders', isAuthenticated, async (req, res) => {
    const userId = req.session.user.id;
    const [orders] = await db.execute('SELECT * FROM orders WHERE userId = ?', [userId]);

    //get the orders items
    for (let order of orders) {
        const [orderItems] = await db.execute('SELECT * FROM orderItems WHERE orderId = ?', [order.id]);
        order.items = [];
        for (let item of orderItems) {
            const [product] = await db.execute('SELECT name FROM products WHERE id = ?', [item.productId]);
            order.items.push({ name: product[0].name, quantity: item.quantity, price: item.priceAtPurchase, subtotal: item.quantity * item.priceAtPurchase });
        }
    }

    //get the total price and shipping cost
    for (let order of orders) {
        const [ totalPrice ] = await db.execute('SELECT totalAmount FROM orders WHERE id = ?', [order.id]);
        const [ shippingCost ] = await db.execute('SELECT shippingCost FROM orders WHERE id = ?', [order.id]);
        order.totalPrice = parseFloat(totalPrice[0].totalAmount);
        order.shippingCost = parseFloat(shippingCost[0].shippingCost);
    }

    res.render('orders.ejs', { orders, items: orders.items, totalPrice: orders.totalPrice, shippingCost: orders.shippingCost });
});

app.get('/order/:id', isAuthenticated, async (req, res) => {
    const orderId = req.params.id;
    const userId = req.session.user.id;

    console.log('Order:', orderId, 'User:', userId);


    const [order] = await db.execute('SELECT * FROM orders WHERE id = ? AND userId = ?', [orderId, userId]);

    if (order.length === 0) {
        return res.status(404).send('Order not found');
    }


    const [orderItems] = await db.execute('SELECT * FROM orderItems WHERE orderId = ?', [orderId]);
    const items = [];
    for (let item of orderItems) {
        const [product] = await db.execute('SELECT name FROM products WHERE id = ?', [item.productId]);
        items.push({ name: product[0].name, quantity: item.quantity, price: item.priceAtPurchase, subtotal: item.quantity * item.priceAtPurchase });
        //check if there's enough left in stock
        const [productQuantity] = await db.execute('SELECT quantity FROM products WHERE id = ?', [item.productId]);
        if (productQuantity[0].quantity < item.quantity) {
            return res.status(400).send(`Not enough of ${product[0].name} in stock`);
        }
    }

    const [ totalPriceResult ] = await db.execute('SELECT totalAmount FROM orders WHERE id = ?', [orderId]);
    const [ shippingCostResult ] = await db.execute('SELECT shippingCost FROM orders WHERE id = ?', [orderId]);
    const totalPrice = totalPriceResult[0].totalAmount;
    const shippingCost = shippingCostResult[0].shippingCost;

    await sendOrderConfirmation(req.session.user.email, orderId, items, totalPrice, shippingCost);

    //delete quantity from stock
    for (let item of orderItems) {
        await db.execute('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.productId]);
    }

    res.redirect('/confirmation')
});

async function sendOrderConfirmation(email, orderId, cartItems, totalPrice, shippingCost) {
    
        // Send an email confirmation after the payment process, the user will receive an invoice email with the data: Order number + item quantity + item name + item quantity + shipping + total amount
        var mailOptions = {
            from: 'studentswap@demomailtrap.com',
            to: 'studentswap.reutlingen@gmail.com', //Only email that works with the demo mailtrap account, should be the 'email' variable in real scenario
            subject: 'Order Confirmation',
            text: `Thank you for your order! \nOrder number: ${orderId} \nItems:\n${cartItems.map(item => `${item.quantity} x ${item.name}`).join('\n ')} \nShipping cost ${shippingCost}€ \nTotal amount: ${totalPrice}€`
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
}

app.get('/confirmation', isAuthenticated, async (req, res) => {
    
    //get the most recent order for the user
    const userId = req.session.user.id;
    const [order] = await db.execute('SELECT * FROM orders WHERE userId = ? ORDER BY id DESC LIMIT 1', [userId]);
    const orderId = order[0].id;

    //get the order items
    const [orderItems] = await db.execute('SELECT * FROM orderItems WHERE orderId = ?', [orderId]);
    
    //get the product names 
    const items = [];
    for (let item of orderItems) {
        const [product] = await db.execute('SELECT name FROM products WHERE id = ?', [item.productId]);
        items.push({ name: product[0].name, quantity: item.quantity, price: item.priceAtPurchase, subtotal: item.quantity * item.priceAtPurchase });
    }

    //get the total price and shipping cost
    const [ totalPriceResult ] = await db.execute('SELECT totalAmount FROM orders WHERE id = ?', [orderId]);
    const [ shippingCostResult ] = await db.execute('SELECT shippingCost FROM orders WHERE id = ?', [orderId]);
    const totalPrice = totalPriceResult[0].totalAmount;
    const shippingCost = shippingCostResult[0].shippingCost;

        console.log('Confirmation:', orderId, items, totalPrice, shippingCost);

        res.render('confirmation.ejs', { orderId, items, totalPrice, shippingCost });
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