const request = require('request');
const crypto = require('crypto');
const apiKey = 'IlSEJJYDiaBijoyRN7HvOaDJ'
const apiSecret = 'CQMlDm9d8UhtE0E8ncJimu3VCf3n_jC39eLZVsQv22oHO2C2'


module.exports = function restRequest(verb, path, data) {
  var expires = new Date().getTime() + (60 * 1000)
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
  return new Promise(function(resolve, reject) {
    request(requestOptions, function(error, response, body) {
      if (error) { console.log(error); }
      else { resolve(JSON.parse(body)); }
    });
  })
};
