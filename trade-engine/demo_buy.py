from pybit.unified_trading import HTTP

session = HTTP(
    api_key="f9L6FeOrLIVCjWP8G6",
    api_secret="hRNx85ZwIzxwkCsF6VL59UzkUDh66XviZp5C",
    demo = True
)

usdt_amount = 1000
symbol = "ETHUSDT"
leverage = 25

price_data = session.get_tickers(category="linear", symbol=symbol)
last_price = float(price_data["result"]["list"][0]["lastPrice"])

cc_qty = round(usdt_amount * leverage / last_price, 2)

tp_percent = 0.05 / 100   # 0.5%
takeprofit = last_price * (1 + tp_percent)

session.place_order(
    category="linear",
    symbol=symbol,
    side="Buy",
    orderType="Limit",
    qty=cc_qty,
    price=last_price - 0.1,
    timeInForce="PostOnly"
)

tp_price = last_price * 1.005

session.set_trading_stop(
    category="linear",
    symbol=symbol,
    takeProfit=tp_price,
    tpTriggerBy="LastPrice"
)
