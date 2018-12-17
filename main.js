const bitmex = require('./bitmex.js');

function main() {
    let data = null;
    const get = 'GET';
    const post = 'POST';
    
    const orderPath = '/api/v1/order';
    const orderClosePath = orderPath + '/closePosition';
    const userWalletPath = '/api/v1/user/walletSummary';
    const leveragePath = '/api/v1/position/leverage';
    const tradePath = '/api/v1/trade';
    
    data = { currency: "XBt" };
    bitmex(get, userWalletPath, data).then((result) => {
        let walletBalance = result[2].walletBalance;
        data = { symbol: "XBTUSD", count: 1, reverse: true };
        bitmex(get, tradePath, data).then((res) => {
            let currentPrice = Math.floor(+res[0].price);
            let quantity = (currentPrice * walletBalance * 50)/100000000;
            console.log(walletBalance, quantity);
            data = { symbol: "XBTUSD", orderQty: Math.floor(1 + quantity*0.3), side: "Sell", ordType: "Market" }
            bitmex(post, orderPath, data).then((res) => {
                data = { symbol: "XBTUSD", side: "Buy", ordType: "Stop", execInst: "Close", stopPx:currentPrice+10  }
                bitmex(post, orderPath, data).then((res) => {
                    data = { symbol: "XBTUSD", price: currentPrice-15 }
                    bitmex(post, orderClosePath, data).then((res) => {
                        console.log("CLOSE")
                    });
                });
            });
        });
    })
}

main()