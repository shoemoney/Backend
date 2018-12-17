const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const api = require('./routers/api');
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const rxjs = require('rxjs');
const fs = require('fs');
var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();

const https = require('https');
var ohlcData = [];
const brain = require('brain.js');
const net = new brain.recurrent.LSTMTimeStep();
net.maxPredictionLength = 1000000000;
netSettings = {
    iterations: 800,
    errorThresh: 0.005,
    log: false,
    logPeriod: 10,
    learningRate: 0.3,
    momentum: 0.1,
    callback: null,
    callbackPeriod: 10,
    timeout: 1000,
}

class ohlcDataModel {
    constructor(data) {
        this.open = Math.floor(data.open);
        this.close = Math.floor(data.close);
        this.high = Math.floor(data.high);
        this.low = Math.floor(data.low);
        this.timestamp = new Date(data.timestamp);
        this.diff = Math.floor(data.close - data.open);
        this.avg = Math.floor((data.low + data.high)/2);
    }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'static')));
app.use('/api', api);
app.get('*', function(req, res){
    res.sendFile(__dirname + '/static/index.html');
});
app.set('socketio', io);

io.on('connection', function(socket){
    console.log('User connected',socket.id);
    socket.on('controllers', function(data) {
        console.log(data)
        socket.emit('controllers', data);
    })
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});
http.listen(port, function(){
    console.log('listening on *:' + port);
});



function getOHLCdata(url) {
    https.get(url, (resp) => {
        resp.on('data', (chunk) => {
            ohlcData += chunk;
        });
        resp.on('end', () => {
            ohlcData = JSON.parse(ohlcData).reverse().map(element => element = new ohlcDataModel(element));
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}

function checkTrend(data,period) {
    return data.reduce((a,b,index) => {
        return index>period? a + b : null;
    });    
}

function calcExtremes(data) {
    let extremes = [];
    for (index=2; index < 498; index++) {
        if ((data.avg > data.avg) && (data.avg > data.avg)) {
            if ((data.avg > ohlcData[index-2].avg) && (data.avg > ohlcData[index-1].avg)) {
                extremes.push({max: data.avg, timestamp: data.timestamp}) 
            }
        }
        if ((data.avg < data.avg) && (data.avg < data.avg)) {
            if ((data.avg < ohlcData[index-2].avg) && (data.avg < ohlcData[index-1].avg)) {
                extremes.push({min: data.avg, timestamp: data.timestamp}) 
            }
        }
    }
}
const baseUrl = 'https://www.bitmex.com/api/v1/trade/bucketed'
const options = '&partial=true&symbol=XBTUSD&columns=open%2C%20close%2C%20high%2C%20low&count=500&reverse=true'
const oneDayUrl = baseUrl + '?binSize=1m' + options;
// const fiveMinUrl = baseUrl + '?binSize=5m' + options;
// const oneMinUrl = baseUrl + '?binSize=1m' + options;

getOHLCdata(oneDayUrl).subscribe(o => {console.log('TEST TEST')});

client.on('connectFailed', function (error) {
  console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
  connection.on('error', function (error) {
      console.log("Connection Error: " + error.toString());
  });
  connection.on('close', function () {
      console.log('echo-protocol Connection Closed');
  });
  connection.on('message', function (message) {
      if (JSON.parse(message.utf8Data).data) {
        //   const currentValue = new ohlcDataModel(JSON.parse(message.utf8Data).data[0]);
          if (ohlcData.length) {
            //   ohlcData.push(currentValue);
            //   saveFile(ohlcData, 'data');
            //   saveFile(net, 'network');
            //   net.train([
            //       ohlcData
            //   ], netSettings);
            //   const output = net.run(ohlcData.slice(-1));
            //   console.log('CURRENT', currentValue, 'RESULT: ', output);
          }
      }
  });
});
// client.connect('wss://www.bitmex.com/realtime?subscribe=tradeBin5m:XBTUSD');


// function saveFile(data, filename) {
//   console.log(typeof(data))
//   fs.appendFile(filename + ".txt", JSON.stringify(data), function (err) {
//       if (err) {
//           return console.log(err);
//       }
//   });
// }

// function loadFile() {
//   return fs.readFileSync("neuralNet.txt", { encoding: 'utf8' });
// }