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