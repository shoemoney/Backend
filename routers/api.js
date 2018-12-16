const express = require('express');
const router = express.Router();

var https = require("https");


var options = {
  host: 'api.binance.com',
  path: '/api/v1/klines?symbol=BTCUSDT&interval=1M',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

router.get('/users', (req, res) => {
  var io = req.app.get('socketio');
  console.log('TEST')
  io.emit('controllers','TEST') 
  res.send(data);
});

router.get('/candle', (req, res) => {
  var request = https.request(options, function (response) {
    var chunks = [];
  
    response.on("data", function (chunk) {
      chunks.push(chunk);
      res.send(chunk);
    });
  
  });
  request.end();
});

module.exports = router;

const data = [
      {
      "id": 1,
      "username": "JanK",
      "first_name": "Jan",
      "last_name": "K",
      "email": "j@k",
      "passwor": "pass",
      "group": [],
      "user_permission": [],
      "is_staf": true,
      "is_activ": true,
      "is_superuse": false,
      "last_login": "2012-12-11",
      "date_joine": "2012-12-11",
      "birth_date": "2002-12-11",
      "sex": "male",
      "height": "200",
      "weight": "130"
      }
    ,
      {
      "id": 2,
      "username": "AanK",
      "first_name": "Aan",
      "last_name": "K",
      "email": "j@k",
      "passwor": "pass",
      "group": [],
      "user_permission": [],
      "is_staf": true,
      "is_activ": true,
      "is_superuse": false,
      "last_login": "2012-12-11",
      "date_joine": "2012-12-11",
      "birth_date": "2002-12-11",
      "sex": "male",
      "height": "200",
      "weight": "130"
    }
    ,
      {
      "id": 3,
      "username": "AanKadas",
      "first_name": "Aan",
      "last_name": "K",
      "email": "j@k",
      "passwor": "pass",
      "group": [],
      "user_permission": [],
      "is_staf": true,
      "is_activ": true,
      "is_superuse": false,
      "last_login": "2012-12-11",
      "date_joine": "2012-12-11",
      "birth_date": "2002-12-11",
      "sex": "male",
      "height": "200",
      "weight": "130"
    }
    ,
      {
      "id": 4,
      "username": "CZCVAanK",
      "first_name": "Aan",
      "last_name": "K",
      "email": "j@k",
      "passwor": "pass",
      "group": [],
      "user_permission": [],
      "is_staf": true,
      "is_activ": true,
      "is_superuse": false,
      "last_login": "2012-12-11",
      "date_joine": "2012-12-11",
      "birth_date": "2002-12-11",
      "sex": "male",
      "height": "200",
      "weight": "130"
    }
    ,
      {
      "id": 5,
      "username": "CZXCZXCAanK",
      "first_name": "Aan",
      "last_name": "K",
      "email": "j@k",
      "passwor": "pass",
      "group": [],
      "user_permission": [],
      "is_staf": true,
      "is_activ": true,
      "is_superuse": false,
      "last_login": "2012-12-11",
      "date_joine": "2012-12-11",
      "birth_date": "2002-12-11",
      "sex": "male",
      "height": "200",
      "weight": "130"
    }
    ,
      {
      "id": 6,
      "username": "ghrthrAanK",
      "first_name": "Aan",
      "last_name": "K",
      "email": "j@k",
      "passwor": "pass",
      "group": [],
      "user_permission": [],
      "is_staf": true,
      "is_activ": true,
      "is_superuse": false,
      "last_login": "2012-12-11",
      "date_joine": "2012-12-11",
      "birth_date": "2002-12-11",
      "sex": "male",
      "height": "200",
      "weight": "130"
    }
    ,
      {
      "id": 7,
      "username": "RRRAanK",
      "first_name": "Aan",
      "last_name": "K",
      "email": "j@k",
      "passwor": "pass",
      "group": [],
      "user_permission": [],
      "is_staf": true,
      "is_activ": true,
      "is_superuse": false,
      "last_login": "2012-12-11",
      "date_joine": "2012-12-11",
      "birth_date": "2002-12-11",
      "sex": "male",
      "height": "200",
      "weight": "130"
    }
  
    ]

  