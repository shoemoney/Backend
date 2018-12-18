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
        return index > (data.length - period) ? a + b : null;
    });
}

function calcExtremes(data) {
    let extremes = {
        min: [],
        max: []
    };
    for (index = 3; index < 497; index++) {
        if ((data[index].avg > data[index + 3].avg) && (data[index].avg > data[index + 2].avg) && (data[index].avg > data[index + 1].avg)) {
            if ((data[index].avg > data[index - 3].avg) && (data[index].avg > data[index - 2].avg) && (data[index].avg > data[index - 1].avg)) {
                extremes.max.push({ max: data[index].avg, timestamp: data[index].timestamp })
            }
        }
        if ((data[index].avg < data[index + 3].avg) && (data[index].avg < data[index + 2].avg) && (data[index].avg < data[index + 1].avg)) {
            if ((data[index].avg < data[index - 3].avg) && (data[index].avg < data[index - 2].avg) && (data[index].avg < data[index - 1].avg)) {
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

function groupSupres(data) {
    let result = data.sort().reduce((r, n) => {
        let lastSubArray = r[r.length - 1];
        if (!lastSubArray || (lastSubArray[lastSubArray.length - 1] * 1.03 < n || lastSubArray[lastSubArray.length - 1] * 0.97 > n)) {
            r.push([]);
        }
        r[r.length - 1].push(n);
        return r;
    }, []);
    return result.map( element => {
        return {
            price: Math.floor(element.reduce( (a, b) => a+b)/element.length),
            quantity: element.length
        }            
    }).sort((a,b) => a.price - b.price);
}

function checkSupRes(currentPrice, trend1m, sup1d, sup5m, sup1m, res1d, res5m, res1m) {
    let s1d = sup1d.filter( element => (element.price * 0.97) < currentPrice).sort((a,b) => b.price-a.price)[0];
    let s5m = sup5m.filter( element => (element.price * 0.97) < currentPrice).sort((a,b) => b.price-a.price)[0];
    let s1m = sup1m.filter( element => (element.price * 0.97) < currentPrice).sort((a,b) => b.price-a.price)[0];
    let r1d = res1d.filter( element => (element.price * 1.03) > currentPrice).sort((a,b) => a.price-b.price)[0];
    let r5m = res5m.filter( element => (element.price * 1.03) > currentPrice).sort((a,b) => a.price-b.price)[0];
    let r1m = res1m.filter( element => (element.price * 1.03) > currentPrice).sort((a,b) => a.price-b.price)[0];
    if (s1d == undefined) { s1d = { price: 0 } }
    if (s5m == undefined) { s5m = { price: 0 } }
    if (s1m == undefined) { s1m = { price: 0 } }
    if (r1d == undefined) { r1d = { price: 99999 } }
    if (r5m == undefined) { r5m = { price: 99999 } }
    if (r1m == undefined) { r1m = { price: 99999 } }
    console.log("CURRENT PRICE:", currentPrice);
    console.log("CURRENT TREND:", trend1m);
    closestResistance = Math.min(...[r1d.price,r5m.price,r1m.price]);
    closestSupport = Math.max(...[s1d.price,s5m.price,s1m.price]);
    
    let res = Math.abs(closestResistance*1.03-currentPrice);
    let sup = Math.abs(closestSupport*0.97-currentPrice);
    let resDiff = res/(res+sup)
    let supDiff = sup/(res+sup)
    console.log("Resistance", Math.floor(closestResistance*1.03), resDiff);
    console.log("Support", Math.floor(closestSupport*0.97), supDiff);
    if(trend1m < 0 && currentPrice < closestResistance*1.03 && supDiff < 0.25 ) {
        console.log("SELL")
    }
    if(trend1m > 0 && currentPrice > closestSupport*0.97 && resDiff < 0.25) {
        console.log("BUY")
    }
}

function checkCurrentStatus(currentPrice) {
    let data = null;
    data = { symbol: "XBTUSD", binSize: "1d", count: 500, reverse: true };
    bitmex(get, tradeBucketedPath, data).then((result) => {
        var ohlcData1d = result.reverse().map(element => element = new ohlcDataModel(element));
        var extremes1d = calcExtremes(ohlcData1d);
        var support1d = groupSupres(extremes1d.min.map(item => item.min));
        var resistance1d = groupSupres(extremes1d.max.map(item => item.max));
        data = { symbol: "XBTUSD", binSize: "5m", count: 500, reverse: true };
        bitmex(get, tradeBucketedPath, data).then((result) => {
            var ohlcData5m = result.reverse().map(element => element = new ohlcDataModel(element));
            var extremes5m = calcExtremes(ohlcData5m);
            var support5m = groupSupres(extremes5m.min.map(item => item.min));
            var resistance5m = groupSupres(extremes5m.max.map(item => item.max));
            data = { symbol: "XBTUSD", binSize: "1m", count: 500, reverse: true };
            bitmex(get, tradeBucketedPath, data).then((result) => {
                var ohlcData1m = result.reverse().map(element => element = new ohlcDataModel(element));
                var extremes1m = calcExtremes(ohlcData1m);
                var support1m = groupSupres(extremes1m.min.map(item => item.min));
                var resistance1m = groupSupres(extremes1m.max.map(item => item.max));
                var trend1m = checkTrend(ohlcData1m, 5);
                checkSupRes(currentPrice, trend1m ,support1d, support5m, support1m, resistance1d, resistance5m, resistance1m);
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
            checkCurrentStatus(JSON.parse(message.utf8Data).data[0].close);
        }
    });
});
client.connect('wss://www.bitmex.com/realtime?subscribe=tradeBin1m:XBTUSD');