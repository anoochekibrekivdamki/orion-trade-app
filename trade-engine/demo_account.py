from pybit.unified_trading import HTTP

session = HTTP(
    api_key="f9L6FeOrLIVCjWP8G6",
    api_secret="hRNx85ZwIzxwkCsF6VL59UzkUDh66XviZp5C",
    demo = True
)

resp = session.get_positions(
    category="linear",      # for perps
    settleCoin="USDT"
)

positions = resp["result"]["list"]

for p in positions:
    if float(p["size"]) != 0:
        print({
            "symbol": p["symbol"],
            "side": p["side"],
            "size": p["size"],
            "entry_price": p["avgPrice"],
            "mark_price": p["markPrice"],
            "unrealised_pnl": p["unrealisedPnl"],
            "leverage": p["leverage"]
        })
