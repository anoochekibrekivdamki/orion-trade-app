import { calculateSMA } from './indicators/sma.js';

(async () => {
    const container = document.getElementById('chart');

    const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: { background: { color: '#222' }, textColor: '#DDD' },
        grid: {
            vertLines: { color: 'rgba(255,255,255,0.1)' },
            horzLines: { color: 'rgba(255,255,255,0.15)' }
        },
        timeScale: { timeVisible: true }
    });

    const candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        borderVisible: false
    });

    const smaSeries = chart.addSeries(LightweightCharts.LineSeries, {
        color: 'rgba(142,124,195,1)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false
    });

    const seriesMarkers = LightweightCharts.createSeriesMarkers(candleSeries);

    let candles = [];
    let smaData = [];
    let smaPeriod = 14;
    let currentIndex = 0;
    let intervalId = null;

    let cash = 1000;
    let position = 0;
    let trades = [];

    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');
    const nextButton = document.getElementById('nextButton');
    const prevButton = document.getElementById('prevButton');
    const resetButton = document.getElementById('resetButton');
    const metricsContainer = document.getElementById('metrics');

    async function loadHistory() {
        const res = await fetch('/history?symbol=BTCUSDT&interval=15&limit=200');
        candles = (await res.json()).filter(c => c.time);
    }

    function recalcSMAUpTo(index) {
        if (index < smaPeriod) return null;
        const slice = candles.slice(index - smaPeriod, index);
        return slice.reduce((a, c) => a + c.close, 0) / smaPeriod;
    }

    function calculateMetrics(trades, finalBalance) {
        let wins = 0, losses = 0, peak = 1000, maxDrawdown = 0;
        let equity = 1000;

        trades.forEach(trade => {
            if (!trade.priceSell) return;
            const profit =
                trade.priceSell * trade.position -
                trade.priceBuy * trade.position;

            if (profit > 0) wins++; else losses++;
            equity += profit;
            if (equity > peak) peak = equity;

            const dd = peak - equity;
            if (dd > maxDrawdown) maxDrawdown = dd;
        });

        return {
            finalBalance,
            totalTrades: trades.filter(t => t.priceSell).length,
            winRate: wins + losses ? (wins / (wins + losses) * 100).toFixed(2) : 0,
            maxDrawdown: maxDrawdown.toFixed(2)
        };
    }

    function updateMetrics(lastPrice) {
        const finalBalance = cash + position * lastPrice;
        const metrics = calculateMetrics(trades, finalBalance);

        metricsContainer.innerHTML = `
            <p><strong>Balance:</strong> ${metrics.finalBalance.toFixed(2)}</p>
            <p><strong>Trades:</strong> ${metrics.totalTrades}</p>
            <p><strong>Win rate:</strong> ${metrics.winRate}%</p>
            <p><strong>Max DD:</strong> ${metrics.maxDrawdown}</p>
        `;
    }

    function updateTradeMarkers() {
        const markers = trades
            .filter(trade => trade.priceBuy)
            .flatMap(trade => {
                const arr = [];

                // Buy
                arr.push({
                    time: trade.time,
                    position: 'belowBar',
                    color: 'green',
                    shape: 'arrowUp',
                    text: 'buy',
                    size: 1
                });

                // Sell
                if (trade.priceSell) {
                    arr.push({
                        time: trade.sellTime,
                        position: 'aboveBar',
                        color: 'red',
                        shape: 'arrowDown',
                        text: 'sell',
                        size: 1
                    });
                }

                return arr;
            });

        if (candles.length >= 15) {
            markers.push({
                time: candles[candles.length - 15].time,
                position: 'aboveBar',
                color: 'rgba(255,69,109,0)',
                shape: 'arrowDown',
                text: 'test',
                size: 1
            });
        }

        seriesMarkers.setMarkers(markers);
    }

    function resetBacktest() {
        if (intervalId) clearInterval(intervalId);

        candleSeries.setData([]);
        smaSeries.setData([]);
        seriesMarkers.setMarkers([]);

        currentIndex = 0;
        cash = 1000;
        position = 0;
        trades = [];

        metricsContainer.innerHTML = `
            <p><strong>Balance:</strong> –</p>
            <p><strong>Trades:</strong> –</p>
            <p><strong>Win rate:</strong> –</p>
            <p><strong>Max DD:</strong> –</p>
        `;
    }

    function processCandle(index) {
        const candle = candles[index];

        if (index === 0) candleSeries.setData([candle]);
        else candleSeries.update(candle);

        const smaValue = recalcSMAUpTo(index);
        if (smaValue != null) {
            const smaPoint = { time: candle.time, value: smaValue };
            if (smaData.length === 0) smaSeries.setData([smaPoint]);
            else smaSeries.update(smaPoint);
            smaData.push(smaPoint);

            if (candle.close > smaValue && cash > 0) {
                position = cash / candle.close;
                trades.push({
                    type: 'buy',
                    priceBuy: candle.close,
                    position,
                    time: candle.time
                });
                cash = 0;

                updateTradeMarkers();
            } else if (candle.close < smaValue && position > 0) {
                cash = position * candle.close;
                trades[trades.length - 1].priceSell = candle.close;
                trades[trades.length - 1].sellTime = candle.time;
                position = 0;

                updateTradeMarkers();
            }
        }

        updateMetrics(candle.close);
    }

    function play() {
        if (intervalId) return;
        intervalId = setInterval(() => {
            if (currentIndex >= candles.length) {
                clearInterval(intervalId);
                intervalId = null;
                return;
            }
            processCandle(currentIndex);
            currentIndex++;
        }, 50);
    }

    function pause() {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
    }

    function stepForward() {
        if (currentIndex >= candles.length) return;
        processCandle(currentIndex);
        currentIndex++;
    }

    function stepBackward() {
        if (currentIndex <= 0) return;
        currentIndex--;

        candleSeries.setData(candles.slice(0, currentIndex + 1));

        const smaToShow = [];
        cash = 1000;
        position = 0;
        trades = [];

        for (let i = 0; i <= currentIndex; i++) {
            const v = recalcSMAUpTo(i);
            if (v != null) {
                smaToShow.push({ time: candles[i].time, value: v });

                if (candles[i].close > v && cash > 0) {
                    position = cash / candles[i].close;
                    trades.push({
                        type: 'buy',
                        priceBuy: candles[i].close,
                        position,
                        time: candles[i].time
                    });
                    cash = 0;
                } else if (candles[i].close < v && position > 0) {
                    cash = position * candles[i].close;
                    trades[trades.length - 1].priceSell = candles[i].close;
                    trades[trades.length - 1].sellTime = candles[i].time;
                    position = 0;
                }
            }
        }

        smaSeries.setData(smaToShow);

        updateTradeMarkers();
        updateMetrics(candles[currentIndex].close);
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') stepForward();
        if (e.key === 'ArrowLeft') stepBackward();
    });

    await loadHistory();

    playButton.addEventListener('click', play);
    pauseButton.addEventListener('click', pause);
    nextButton.addEventListener('click', stepForward);
    prevButton.addEventListener('click', stepBackward);
    resetButton.addEventListener('click', resetBacktest);
})();
