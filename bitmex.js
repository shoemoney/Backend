var request = require('request');
var crypto = require('crypto');

const apiKey = 'IlSEJJYDiaBijoyRN7HvOaDJ'
const apiSecret = 'CQMlDm9d8UhtE0E8ncJimu3VCf3n_jC39eLZVsQv22oHO2C2'

var verb = 'POST',
  path = '/api/v1/order/closePosition', //
  expires = new Date().getTime() + (60 * 1000),
  data = {symbol:"XBTUSD", price:3222}//orderQty:1,ordType:"Market"};

var postBody = JSON.stringify(data);

var signature = crypto.createHmac('sha256', apiSecret).update(verb + path + expires + postBody).digest('hex');

var headers = {
  'content-type' : 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
  'api-expires': expires,
  'api-key': apiKey,
  'api-signature': signature
};

const requestOptions = {
  headers: headers,
  url:'https://www.bitmex.com'+path,
  method: verb,
  body: postBody
};

request(requestOptions, function(error, response, body) {
  if (error) { console.log(error); }
  console.log(body);
});