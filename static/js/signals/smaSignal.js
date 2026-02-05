let lastState = 0;

export function checkSMASignals({ candle, smaData }) {
    if (!smaData.length) return;

    const lastSMA = smaData[smaData.length - 1];
    if (!lastSMA) return;

    const price = candle.close;
    const sma = lastSMA.value;

    const state = price > sma ? 'above' : 'below';

    if (lastState && state !== lastState) {
        console.log(
            state === 'above'
                ? '⚡ PRICE CROSSED SMA UP (realtime)'
                : '⚡ PRICE CROSSED SMA DOWN (realtime)',
            {
                time: candle.time,
                price,
                sma
            }
        );
    }

    lastState = state;
}
