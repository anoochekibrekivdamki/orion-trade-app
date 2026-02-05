from pybit.unified_trading import WebSocket
from time import sleep


ws = WebSocket(
    testnet=False,
    demo=True,
    channel_type="private",
    api_key="",
    api_secret=""
)

def handle_message(message):
    print(message)

ws.position_stream(callback=handle_message)

while True:
    sleep(1)