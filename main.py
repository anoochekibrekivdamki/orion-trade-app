from fastapi import FastAPI, Request, Depends, WebSocket
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.status import HTTP_302_FOUND

from auth import router as auth_router, get_current_user
from database import Base, engine

import json
import requests
import websockets



BYBIT_WS_URL = "wss://stream.bybit.com/v5/public/linear"
BYBIT_REST_URL = "https://api.bybit.com/v5/market/kline"

SYMBOL = "BTCUSDT"
INTERVAL = "15"  # 15 minutes

Base.metadata.create_all(bind=engine)

app = FastAPI()

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router)


@app.get("/", response_class=HTMLResponse, name="index")
def index(request: Request, user=Depends(get_current_user)):
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "user": user},
    )


@app.get("/profile", response_class=HTMLResponse, name="profile")
def profile(request: Request, user=Depends(get_current_user)):
    if not user:
        return RedirectResponse("/login", status_code=HTTP_302_FOUND)

    return templates.TemplateResponse(
        "profile.html",
        {"request": request, "user": user},
    )


@app.get("/tg_bot", response_class=HTMLResponse, name="tg_bot")
def tg_bot(request: Request, user=Depends(get_current_user)):
    if not user:
        return RedirectResponse("/login", status_code=HTTP_302_FOUND)

    return templates.TemplateResponse(
        "tg_bot.html",
        {"request": request, "user": user},
    )


@app.get("/backtester", response_class=HTMLResponse, name="backtester")
def backtester(request: Request, user=Depends(get_current_user)):
    if not user:
        return RedirectResponse("/login", status_code=HTTP_302_FOUND)

    return templates.TemplateResponse(
        "backtester.html",
        {"request": request, "user": user},
    )


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()

    try:
        async with websockets.connect(BYBIT_WS_URL) as bybit_ws:

            subscribe_msg = {
                "op": "subscribe",
                "args": [f"kline.{INTERVAL}.{SYMBOL}"],
            }
            await bybit_ws.send(json.dumps(subscribe_msg))

            async for message in bybit_ws:
                msg = json.loads(message)

                if "data" not in msg:
                    continue

                k = msg["data"][0]

                tick = {
                    "time": int(int(k["start"]) / 1000),
                    "open": float(k["open"]),
                    "high": float(k["high"]),
                    "low": float(k["low"]),
                    "close": float(k["close"]),
                    "volume": float(k["volume"]),
                }

                await ws.send_json(tick)

    except Exception as e:
        print("WS disconnected:", e)


@app.get("/history")
async def history(
    symbol: str = SYMBOL,
    interval: str = INTERVAL,
    limit: int = 500,
):
    params = {
        "category": "linear",
        "symbol": symbol.upper(),
        "interval": interval,
        "limit": limit,
    }

    r = requests.get(BYBIT_REST_URL, params=params)
    r.raise_for_status()

    data = r.json()["result"]["list"]

    candles = [
        {
            "time": int(int(item[0]) / 1000),
            "open": float(item[1]),
            "high": float(item[2]),
            "low": float(item[3]),
            "close": float(item[4]),
            "volume": float(item[5]),
        }
        for item in reversed(data)
    ]

    return candles
