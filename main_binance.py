from fastapi import FastAPI, Request, Depends, WebSocket
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from starlette.status import HTTP_302_FOUND
from auth import router as auth_router, get_current_user
from database import Base, engine
import asyncio, random, time

import requests
import json
from fastapi import FastAPI, WebSocket
import websockets

from fastapi.staticfiles import StaticFiles


BINANCE_WS_URL = "wss://fstream.binance.com/ws/btcusdt@kline_15m"

Base.metadata.create_all(bind=engine)

app = FastAPI()

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router)

@app.get("/", response_class=HTMLResponse, name="index")
def index(request: Request, user=Depends(get_current_user)):
    return templates.TemplateResponse("index.html", {"request": request, "user": user})

@app.get("/profile", response_class=HTMLResponse, name="profile")
def profile(request: Request, user=Depends(get_current_user)):
    if not user:
        return RedirectResponse("/login", status_code=HTTP_302_FOUND)
    return templates.TemplateResponse("profile.html", {"request": request, "user": user})

@app.get("/tg_bot", response_class=HTMLResponse, name="tg_bot")
def profile(request: Request, user=Depends(get_current_user)):
    if not user:
        return RedirectResponse("/login", status_code=HTTP_302_FOUND)
    return templates.TemplateResponse("tg_bot.html", {"request": request, "user": user})

@app.get("/backtester", response_class=HTMLResponse, name="backtester")
def profile(request: Request, user=Depends(get_current_user)):
    if not user:
        return RedirectResponse("/login", status_code=HTTP_302_FOUND)
    return templates.TemplateResponse("backtester.html", {"request": request, "user": user})

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        async with websockets.connect(BINANCE_WS_URL) as binance_ws:
            async for message in binance_ws:
                data = json.loads(message)
                print(data)
                k = data['k']
                tick = {
                    "time": int(k['t'] / 1000),
                    "open": float(k['o']),
                    "high": float(k['h']),
                    "low": float(k['l']),
                    "close": float(k['c']),
                    "volume": float(k['v']),
                }
                print(f"Sending tick: {tick}")
                await ws.send_json(tick)
    except Exception as e:
        print("WS disconnected:", e)


@app.get("/history")
async def history(symbol: str = "BTCUSDT", interval: str = "15m", limit: int = 500):
    url = "https://api.binance.com/api/v3/klines"
    params = {"symbol": symbol.upper(), "interval": interval, "limit": limit}
    r = requests.get(url, params=params)
    r.raise_for_status()
    data = r.json()

    candles = [
        {
            "time": int(item[0] // 1000),  # sec
            "open": float(item[1]),
            "high": float(item[2]),
            "low": float(item[3]),
            "close": float(item[4]),
            "volume": float(item[5]),
        }
        for item in data
    ]
    return candles