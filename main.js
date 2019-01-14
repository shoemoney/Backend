const bitmex = require('./bitmex.js');
var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();
let ohlcModel = require('./models/ohlcData.model');
let ohlcData1dModel = ohlcModel.ohlcData1d;
let ohlcData1hModel = ohlcModel.ohlcData1h;
let ohlcData5mModel = ohlcModel.ohlcData5m;

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/mydb', { useNewUrlParser: true, useCreateIndex: true, });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

function checkTrend(data, period) {
    data = data.map(element => { return element.diff() }).slice(period);
    if ((data.filter(element => element < 0).length > 2) && (data[data.length - 1] < 0)) {
        return -1;
    }
    if ((data.filter(element => element > 0).length > 2) && (data[data.length - 1] > 0)) {
        return 1;
    }
    else {
        return 0;
    }
}


function calcExtremes(data, type) {
    const range = 15;
    const margin = Math.floor(data.map(element => element.avg()).reduce((a, b) => a + b) / data.length * 0.0027)
    let extremes = {
        min: [],
        max: []
    };
    for (index = range; index < data.length - range; index++) {
        let sampleLeft = data.slice(index - range, index);
        let sampleRight = data.slice(index + 1, index + range + 1);
        let leftLengthMax = sampleLeft.filter(element => element.close <= data[index].close).length;
        let rightLengthMax = sampleRight.filter(element => element.close <= data[index].close).length;
        let leftLengthMin = sampleLeft.filter(element => element.close >= data[index].close).length;
        let rightLengthMin = sampleRight.filter(element => element.close >= data[index].close).length;
        if (leftLengthMax === range && rightLengthMax === range) {
            if (
                (Math.min(...sampleLeft.map(element => element.close)) <= (data[index].close - margin)) &&
                (Math.min(...sampleRight.map(element => element.close)) <= (data[index].close - margin))
            ) {
                extremes.max.push({ max: data[index].close, timestamp: data[index].timestamp })
            }
        }
        if (leftLengthMin === range && rightLengthMin === range) {
            if (
                (Math.max(...sampleLeft.map(element => element.close)) >= (data[index].close + margin)) &&
                (Math.max(...sampleRight.map(element => element.close)) >= (data[index].close + margin))
            ) {
                extremes.min.push({ min: data[index].close, timestamp: data[index].timestamp })
            }
        }
    }
    return extremes
}


const get = 'GET';
const post = 'POST';
const put = 'PUT';
const del = 'DELETE';
var stopOrderId = null;
var lastOrder = null;
var lastOrderPrice = null;

const orderPath = '/api/v1/order';
const orderClosePath = orderPath + '/closePosition';
const orderCancellPath = orderPath + '/all';
const userWalletPath = '/api/v1/user/walletSummary';
const positionPath = '/api/v1/position';
const leveragePath = positionPath + '/leverage';
const tradePath = '/api/v1/trade';
const tradeBucketedPath = tradePath + '/bucketed';

function groupSupres(data) {
    let result = data.sort().reduce((r, n) => {
        let lastSubArray = r[r.length - 1];
        if (!lastSubArray || (lastSubArray[lastSubArray.length - 1] * 1.01 < n || lastSubArray[lastSubArray.length - 1] * 0.99 > n)) {
            r.push([]);
        }
        r[r.length - 1].push(n);
        return r;
    }, []);
    return result.map(element => {
        return {
            price: Math.floor(element.reduce((a, b) => a + b) / element.length),
            quantity: element.length
        }
    }).filter(item => item.quantity > 1).sort((a, b) => a.price - b.price);
}
function checkSupRes(currentPrice, trend1m, sup1d, sup1h, sup5m, res1d, res1h, res5m) {
    let s1d = sup1d.filter(element => (element.price) < currentPrice).sort((a, b) => b.price - a.price)[0];
    let s1h = sup1h.filter(element => (element.price) < currentPrice).sort((a, b) => b.price - a.price)[0];
    let s5m = sup5m.filter(element => (element.price) < currentPrice).sort((a, b) => b.price - a.price)[0];
    let r1d = res1d.filter(element => (element.price) > currentPrice).sort((a, b) => a.price - b.price)[0];
    let r1h = res1h.filter(element => (element.price) > currentPrice).sort((a, b) => a.price - b.price)[0];
    let r5m = res5m.filter(element => (element.price) > currentPrice).sort((a, b) => a.price - b.price)[0];
    if (s1d == undefined) { s1d = { price: 0 } }
    if (s1h == undefined) { s1h = { price: 0 } }
    if (s5m == undefined) { s5m = { price: 0 } }
    if (r1d == undefined) { r1d = { price: 99999 } }
    if (r1h == undefined) { r1h = { price: 99999 } }
    if (r5m == undefined) { r5m = { price: 99999 } }
    closestResistance = Math.min(...[r1d.price, r1h.price, r5m.price]);
    closestSupport = Math.max(...[s1d.price, s1h.price, s5m.price]);
    let res = Math.abs(closestResistance - currentPrice);
    let sup = Math.abs(closestSupport - currentPrice);
    let resDiff = res / (res + sup)
    let supDiff = sup / (res + sup)
    console.log(" CURRENT PRICE:", currentPrice, " *** TREND", trend1m, " SUP:", closestSupport, " RES:", closestResistance, " *** SUP DIF:", supDiff, " RES DIFF", resDiff)
    if (trend1m < 0 && resDiff < 0.282 && resDiff > 0.172 && closestResistance > currentPrice) {
        console.log("SET SELL ORDER")
        console.log("SUPPORT:", closestSupport, "RESISTANCE:", closestResistance);
        console.log("RES/SUP:", resDiff);
        console.log("CLOSE:", closestSupport + 5);
        placeOrder("Sell", closestSupport + 5)
    }
    if (trend1m > 0 && supDiff < 0.282 && supDiff > 0.172 && closestSupport < currentPrice) {
        console.log("SET BUY ORDER")
        console.log("SUPPORT:", closestSupport, "RESISTANCE:", closestResistance);
        console.log("RES/SUP:", resDiff);
        console.log("CLOSE:", closestResistance - 5);
        placeOrder("Buy", closestResistance - 5)
    }
}


function checkForUpdate(data, type) {
    let parameters = null;
    let dateNow = new Date(Date.now());
    let currentDate = dateNow.toISOString().split('T')[0];
    let currentTime = dateNow.toISOString().split('T')[1];
    data.find(function (err, element) {
        if (err) return next(err);
        let last = element.slice(-1)[0].timestamp;
        let lastDate = last.toISOString().split('T')[0];
        let lastTime = last.toISOString().split('T')[1];
        console.log(currentDate, lastDate)
        if (type == '1d') { 
            if (lastDate != currentDate) {
                var difference = new Date(currentDate) - new Date(lastDate);
                console.log(difference)
                parameters = { symbol: "XBTUSD", binSize: "1d", count: difference, reverse: true };
                bitmex(get, tradeBucketedPath, data).then((result) => {});
            };
        };
        if (type == '1h') {  };
        if (type == '5m') {  };
    })
}
checkForUpdate(ohlcData1dModel, '1d');
// checkCurrentStatus(4000);

function checkCurrentStatus(currentPrice) {
    // checkForUpdate(ohlcData1dModel, '1d');
    // checkForUpdate(ohlcData1hModel, '1h');
    // checkForUpdate(ohlcData5mModel, '5m');
    
    
    
    
    
    
    
    
    
    
    let data = { symbol: "XBTUSD", binSize: "1d", count: 750, reverse: true };
    bitmex(get, tradeBucketedPath, data).then((result) => {
        var ohlcData1d = result.reverse().map(element => element = new ohlcData1dModel(element));
        ohlcData1d.forEach(element => { element.save()});
        var extremes1d = calcExtremes(ohlcData1d, "1day");
        var support1d = groupSupres(extremes1d.min.map(item => item.min));
        var resistance1d = groupSupres(extremes1d.max.map(item => item.max));
        data = { symbol: "XBTUSD", binSize: "1h", count: 750, reverse: true };
        bitmex(get, tradeBucketedPath, data).then((result) => {
            var ohlcData1h = result.reverse().map(element => element = new ohlcData1hModel(element));
            ohlcData1h.forEach(element => { element.save()});
            var extremes1h = calcExtremes(ohlcData1h, "1hour");
            var support1h = groupSupres(extremes1h.min.map(item => item.min));
            var resistance1h = groupSupres(extremes1h.max.map(item => item.max));
            data = { symbol: "XBTUSD", binSize: "5m", count: 750, reverse: true };
            bitmex(get, tradeBucketedPath, data).then((result) => {
                var ohlcData5m = result.reverse().map(element => element = new ohlcData5mModel(element));
                ohlcData5m.forEach(element => { element.save()});
                var extremes5m = calcExtremes(ohlcData5m, "5min");
                var support5m = groupSupres(extremes5m.min.map(item => item.min));
                var resistance5m = groupSupres(extremes5m.max.map(item => item.max));
                data = { symbol: "XBTUSD", binSize: "1m", count: 750, reverse: true };
                bitmex(get, tradeBucketedPath, data).then((result) => {
                    var ohlcData1m = result.reverse().map(element => element = new ohlcData1mModel(element));
                    var trend1m = checkTrend(ohlcData1m, 5);
                    checkSupRes(currentPrice, trend1m, support1d, support1h, support5m, resistance1d, resistance1h, resistance5m);
                });
            });
        })

    });
}

function placeOrder(orderSide, stopPrice) {
    console.log("CANCEL ALL ORDERS")
    let data = null;
    data = { symbol: "XBTUSD" };
    bitmex(del, orderCancellPath, data).then(() => {
        console.log("PLACE NEW ORDER")
        data = { currency: "XBt" };
        bitmex(get, userWalletPath, data).then((result) => {
            let walletBalance = result[2].walletBalance;
            data = { symbol: "XBTUSD", count: 1, reverse: true };
            bitmex(get, tradePath, data).then((res) => {
                let currentPrice = Math.floor(+res[0].price);
                let quantity = Math.floor(1 + (currentPrice * walletBalance * 65) / 100000000);
                console.log(quantity)
                data = { symbol: "XBTUSD", orderQty: Math.floor(1 + quantity * 0.3), side: orderSide, ordType: "Market" }
                bitmex(post, orderPath, data).then(() => {
                    if (orderSide == "Sell") {
                        var opositeSide = "Buy";
                        var liquidation = currentPrice + 15;
                    }
                    if (orderSide == "Buy") {
                        var opositeSide = "Sell";
                        var liquidation = currentPrice - 15;
                    }
                    data = { symbol: "XBTUSD", side: opositeSide, ordType: "Stop", execInst: "Close", stopPx: liquidation }
                    bitmex(post, orderPath, data).then((res) => {
                        stopOrderId = res.orderID
                    });
                    data = { symbol: "XBTUSD", price: stopPrice }
                    bitmex(post, orderClosePath, data).then((res) => {
                    });
                });
            });
        })
    });
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
            bitmex(get, positionPath, data).then((res) => {
                if (res.length != 0 && res[0].isOpen) {
                    console.log("Position is open");
                    console.log("Current status:", res[0].unrealisedRoePcnt * 100);
                    if (res[0].currentQty < 0) {
                        var orderSide = "Buy";
                        var stopPrice = JSON.parse(message.utf8Data).data[0].close + 5;
                        if (stopPrice < lastOrderPrice) {
                            lastOrder = 1
                        } else {
                            lastOrder = 0
                        }
                    }
                    if (res[0].currentQty > 0) {
                        var orderSide = "Sell";
                        var stopPrice = JSON.parse(message.utf8Data).data[0].close - 5;
                        if (stopPrice > lastOrderPrice) {
                            lastOrder = 1
                        } else {
                            lastOrder = 0
                        }
                    }
                    if (res[0].unrealisedRoePcnt > 0.1 && lastOrder) {
                        console.log("ROE over 10% - secure income / set stop at position open price", JSON.parse(message.utf8Data).data[0].close, stopPrice);
                        data = { symbol: "XBTUSD" };
                        bitmex(del, orderCancellPath, data).then(() => {
                            data = { symbol: "XBTUSD", side: orderSide, ordType: "MarketIfTouched", stopPx: stopPrice, orderQty: res[0].currentQty }
                            bitmex(post, orderPath, data).then(() => {
                                lastOrderPrice = stopPrice;
                            });
                        })
                    }
                } else {
                    // checkCurrentStatus(JSON.parse(message.utf8Data).data[0].close);
                }
            })
        }
    });
});
client.connect('wss://www.bitmex.com/realtime?subscribe=tradeBin1m:XBTUSD');
