const express = require('express');
const mysql2 = require('mysql2');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
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

app.post('/login', (req, res) => {
    username = req.body.username;
    password = req.body.password;
    
    // TODO: remake to use database
    if (username == 'admin' && password == 'admin') {
        res.send('Login Success');
    } else {
        res.send('Login Failed');
    }
    console.log('Login attempted with Username: ' + username + ' and Password: ' + password);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});