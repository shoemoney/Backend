const express = require('express');
const bodyParser = require('body-parser');
const ohlcData = require('./routes/ohlcData.route'); 
const app = express();
app.use('/ohlcData', ohlcData);
let port = 3000;

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/mydb', { useNewUrlParser: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.listen(port, () => {
    console.log('Server is up and running on port numner ' + port);
});