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
        if ((data[index].high > data[index + 3].high) && (data[index].high > data[index + 2].high) && (data[index].high > data[index + 1].high)) {
            if ((data[index].high > data[index - 3].high) && (data[index].high > data[index - 2].high) && (data[index].high > data[index - 1].high)) {
                extremes.max.push({ max: data[index].high, timestamp: data[index].timestamp })
            }
        }
        if ((data[index].low < data[index + 3].low) && (data[index].low < data[index + 2].low) && (data[index].low < data[index + 1].low)) {
            if ((data[index].low < data[index - 3].low) && (data[index].low < data[index - 2].low) && (data[index].low < data[index - 1].low)) {
                extremes.min.push({ min: data[index].low, timestamp: data[index].timestamp })
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
const positionPath = '/api/v1/position';
const leveragePath = positionPath + '/leverage';
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
    let s1d = sup1d.filter( element => (element.price) < currentPrice).sort((a,b) => b.price-a.price)[0];
    let s5m = sup5m.filter( element => (element.price) < currentPrice).sort((a,b) => b.price-a.price)[0];
    let s1m = sup1m.filter( element => (element.price) < currentPrice).sort((a,b) => b.price-a.price)[0];
    let r1d = res1d.filter( element => (element.price) > currentPrice).sort((a,b) => a.price-b.price)[0];
    let r5m = res5m.filter( element => (element.price) > currentPrice).sort((a,b) => a.price-b.price)[0];
    let r1m = res1m.filter( element => (element.price) > currentPrice).sort((a,b) => a.price-b.price)[0];
    if (s1d == undefined) { s1d = { price: 0 } }
    if (s5m == undefined) { s5m = { price: 0 } }
    if (s1m == undefined) { s1m = { price: 0 } }
    if (r1d == undefined) { r1d = { price: 99999 } }
    if (r5m == undefined) { r5m = { price: 99999 } }
    if (r1m == undefined) { r1m = { price: 99999 } }
    closestResistance = Math.min(...[r1d.price,r5m.price,r1m.price]);
    closestSupport = Math.max(...[s1d.price,s5m.price,s1m.price]);
    let res = Math.abs(closestResistance-currentPrice);
    let sup = Math.abs(closestSupport-currentPrice);
    let resDiff = res/(res+sup)
    let supDiff = sup/(res+sup)
    console.log(" CURRENT PRICE:", currentPrice, " *** TREND", trend1m," SUP:", closestSupport, " RES:", closestResistance, " *** SUP DIF:", supDiff, " RES DIFF", resDiff)
    if(trend1m < 0 && resDiff < 0.382 && closestResistance > currentPrice) {
        console.log("SET SELL ORDER")
        console.log("SUPPORT:", closestSupport, "RESISTANCE:", closestResistance);
        console.log("RES/SUP:", resDiff);
        console.log("ORDER: MARKET");
        console.log("CLOSE:",closestSupport+5);
        placeOrder("Sell", closestSupport+5)
    }
    if(trend1m > 0 && supDiff < 0.382 && closestSupport < currentPrice) {
        console.log("SET BUY ORDER")
        console.log("SUPPORT:", closestSupport, "RESISTANCE:", closestResistance);
        console.log("RES/SUP:", resDiff);
        console.log("ORDER: MARKET");
        console.log("CLOSE:",closestResistance-5);
        placeOrder("Buy",closestResistance-5)
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
                var support1m = groupSupres(extremes1m.min.map(item => item.min).slice(-5));
                var resistance1m = groupSupres(extremes1m.max.map(item => item.max).slice(-5));
                var trend1m = checkTrend(ohlcData1m, 5);
                checkSupRes(currentPrice, trend1m ,support1d, support5m, support1m, resistance1d, resistance5m, resistance1m);
            });
        });
    });
}

function placeOrder(orderSide, stopPrice) {
    console.log("PLACE ORDER")
    let data = null;
    data = { currency: "XBt" };
    bitmex(get, userWalletPath, data).then((result) => {
        let walletBalance = result[2].walletBalance;
        data = { symbol: "XBTUSD", count: 1, reverse: true };
        bitmex(get, tradePath, data).then((res) => {
            let currentPrice = Math.floor(+res[0].price);
            let quantity = (currentPrice * walletBalance * 50) / 100000000;
            data = { symbol: "XBTUSD", orderQty: Math.floor(1 + quantity * 0.3), side: orderSide, ordType: "Market" }
            bitmex(post, orderPath, data).then((res) => {
                if (orderSide == "Sell") {
                    var opositeSide = "Buy"
                    var liquidation = currentPrice+15
                }
                if (orderSide == "Buy") {
                    var opositeSide = "Sell"
                    var liquidation = currentPrice-15
                }
                data = { symbol: "XBTUSD", price: stopPrice }
                bitmex(post, orderClosePath, data).then((res) => {
                    data = { symbol: "XBTUSD", side: opositeSide, ordType: "Stop", execInst: "Close", stopPx: liquidation }
                    bitmex(post, orderPath, data).then((res) => {
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
            let data = {};
            bitmex(get, positionPath,data).then((res) => {
                if(res[0].isOpen) {
                    console.log("Position is open - take no action");
                    if(res[0].unrealisedRoePcnt > 0.2) {
                        console.log("Over 20% of income - close position")
                        let stopPrice = JSON.parse(message.utf8Data).data[0].close
                        data = { symbol: "XBTUSD", price: stopPrice }
                            bitmex(post, orderClosePath, data).then((res) => {
                            })
                    } 
                } else {
                    checkCurrentStatus(JSON.parse(message.utf8Data).data[0].close);
                }
            })
        }
    });
});
client.connect('wss://www.bitmex.com/realtime?subscribe=tradeBin1m:XBTUSD');