const bitmex = require('./bitmex.js');
var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();

class ohlcDataModel {
    constructor(data) {
        this.open = Math.floor(data.open);
        this.close = Math.floor(data.close);
        this.high = Math.floor(data.high);
        this.low = Math.floor(data.low);
        this.timestamp = new Date(data.timestamp);
        this.diff = Math.floor(data.close - data.open);
        this.avg = Math.floor((data.low + data.high) / 2);
    }
}

function checkTrend(data, period) {
    data = data.map(element => { return element.diff })
    return data.reduce((a, b, index) => {
        return index > period ? a + b : null;
    });
}

function calcExtremes(data) {
    let extremes = {
        min: [],
        max: []
    };
    for (index = 2; index < 498; index++) {
        if ((data[index].avg > data[index + 2].avg) && (data[index].avg > data[index + 1].avg)) {
            if ((data[index].avg > data[index - 2].avg) && (data[index].avg > data[index - 1].avg)) {
                extremes.max.push({ max: data[index].avg, timestamp: data[index].timestamp })
            }
        }
        if ((data[index].avg < data[index + 2].avg) && (data[index].avg < data[index + 1].avg)) {
            if ((data[index].avg < data[index - 2].avg) && (data[index].avg < data[index - 1].avg)) {
                extremes.min.push({ min: data[index].avg, timestamp: data[index].timestamp })
            }
        }
    }
    return extremes
}

const get = 'GET';
const post = 'POST';
const orderPath = '/api/v1/order';
const orderClosePath = orderPath + '/closePosition';
const userWalletPath = '/api/v1/user/walletSummary';
const leveragePath = '/api/v1/position/leverage';
const tradePath = '/api/v1/trade';
const tradeBucketedPath = tradePath + '/bucketed';

function supres(data, ext) {
    if (data.length < 1) {
        return null
    }
    else {
        let ret = data.filter( element => {
            return (data[0][ext]*1.05>element[ext])&&(data[0][ext]*0.95<element[ext])
        })
        let rest = data.filter( element => {
            return (data[0][ext]*1.05<element[ext])&&(data[0][ext]*0.95>element[ext])
        })
        console.log(ret,rest)
        return ret.push(supres(rest))
    }
}

function checkCurrentStatus() {
    let data = null;
    data = { symbol: "XBTUSD", binSize: "1d", count: 500, reverse: true };
    bitmex(get, tradeBucketedPath, data).then((result) => {
        var ohlcData1d = result.reverse().map(element => element = new ohlcDataModel(element));
        var extremes1d = calcExtremes(ohlcData1d);
        console.log(supres(extremes1d.min, 'min'));
        console.log(checkTrend(ohlcData1d, 100));
        console.log(checkTrend(ohlcData1d, 25));
        console.log(checkTrend(ohlcData1d, 5));
        data = { symbol: "XBTUSD", binSize: "5m", count: 500, reverse: true };
        bitmex(get, tradeBucketedPath, data).then((result) => {
            var ohlcData5m = result.reverse().map(element => element = new ohlcDataModel(element));
            var extremes5m = calcExtremes(ohlcData5m);
            console.log(checkTrend(ohlcData5m, 100));
            console.log(checkTrend(ohlcData5m, 25));
            console.log(checkTrend(ohlcData5m, 5));
            data = { symbol: "XBTUSD", binSize: "1m", count: 500, reverse: true };
            bitmex(get, tradeBucketedPath, data).then((result) => {
                var ohlcData1m = result.reverse().map(element => element = new ohlcDataModel(element));
                var extremes1m = calcExtremes(ohlcData1m);
                console.log(checkTrend(ohlcData1m, 100));
                console.log(checkTrend(ohlcData1m, 25));
                console.log(checkTrend(ohlcData1m, 5));
            });
        });
    });
}

function placeOrder() {
    let data = null;
    data = { currency: "XBt" };
    bitmex(get, userWalletPath, data).then((result) => {
        let walletBalance = result[2].walletBalance;
        data = { symbol: "XBTUSD", count: 1, reverse: true };
        bitmex(get, tradePath, data).then((res) => {
            let currentPrice = Math.floor(+res[0].price);
            let quantity = (currentPrice * walletBalance * 50) / 100000000;
            data = { symbol: "XBTUSD", orderQty: Math.floor(1 + quantity * 0.3), side: "Sell", ordType: "Market" }
            bitmex(post, orderPath, data).then((res) => {
                data = { symbol: "XBTUSD", side: "Buy", ordType: "Stop", execInst: "Close", stopPx: currentPrice + 10 }
                bitmex(post, orderPath, data).then((res) => {
                    data = { symbol: "XBTUSD", price: currentPrice - 15 }
                    bitmex(post, orderClosePath, data).then((res) => {
                    });
                });
            });
        });
    })
}

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
            console.log(JSON.parse(message.utf8Data).data);
            checkCurrentStatus();
        }
    });
});
client.connect('wss://www.bitmex.com/realtime?subscribe=tradeBin1m:XBTUSD');