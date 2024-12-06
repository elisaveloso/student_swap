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

const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    host: "live.smtp.mailtrap.io",
    port: 587,
    auth: {
      user: "api",
      pass: "1b9d0b0b6486e638d63760720f120ace"
    }
  });
  

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.post('/register', (req, res) => {

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

    console.log(password);
    var username = req.body.username;
    var email = req.body.email;

    //save the user to the database
    

    //Sending email works, don't need to test it every time.
    /*var mailOptions = {
        from: 'studentswap@demomailtrap.com',
        to: email,
        subject: 'Welcome to StudentSwap!',
        text: `Hello ${username}! \nThank you for registering an account at StudentSwap!\nHere is your password that you should use to log in the first time: ${password}`
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });*/

    res.redirect('/login');
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