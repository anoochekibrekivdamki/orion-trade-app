import { calculateSMA } from './indicators/sma.js';
import { calculateTMA_UP } from './indicators/tma_atr.js';
import { calculateTMA_DOWN } from './indicators/tma_atr_neg.js';
import { smoothLine } from './indicators/interpolate.js';
import { checkSMASignals } from './signals/smaSignal.js';

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

    /* ===================== SERIES ===================== */

    const candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        borderVisible: false
    });

    const volumeSeries = chart.addSeries(LightweightCharts.HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        priceLineVisible: false,
        lastValueVisible: false
    });

    chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.75, bottom: 0 }
    });

    // transparent now
    const smaSeries = chart.addSeries(LightweightCharts.LineSeries, {
        color: 'rgba(142,124,195,0.3)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false
    });

    /* ===================== TMA BANDS ===================== */
    const tmaUpSeries = chart.addSeries(LightweightCharts.LineSeries, {
        color: 'rgba(252,193,207,1)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false
    });

    const tmaDownSeries = chart.addSeries(LightweightCharts.LineSeries, {
        color: 'rgba(194,255,174,1)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false
    });

    const tmaUp2Series = chart.addSeries(LightweightCharts.LineSeries, {
        color: 'rgba(226,149,178,0.3)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false
    });

    const tmaDown2Series = chart.addSeries(LightweightCharts.LineSeries, {
        color: 'rgba(114,244,174,0.3)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false
    });

    const tmaUp3Series = chart.addSeries(LightweightCharts.LineSeries, {
        color: 'rgba(197,105,154,0.15)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false
    });

    const tmaDown3Series = chart.addSeries(LightweightCharts.LineSeries, {
        color: 'rgba(40,207,174,0.15)',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false
    });

    /* ===================== STATE ===================== */

    let candles = [];
    let smaData = [];
    let smaPeriod = 14;
    let tmaLength = 96;
    let atrPeriod = 96;
    let multiplier = 4;

    /* ===================== SLIDER_SMA ===================== */
    const smaSlider = document.getElementById('smaSlider');
    const smaValue = document.getElementById('smaValue');

    smaValue.textContent = smaPeriod;

    smaSlider.addEventListener('input', () => {
        smaPeriod = Number(smaSlider.value);
        smaValue.textContent = smaPeriod;

        recalcSMAFull();
    });

   /* ===================== SLIDER_TRIMA ===================== */
    const trimaSlider = document.getElementById('trimaSlider');
    const trimaValue = document.getElementById('trimaValue');

    trimaValue.textContent = tmaLength;

    trimaSlider.value = tmaLength;

    trimaSlider.addEventListener('input', () => {
        tmaLength = Number(trimaSlider.value);
        trimaValue.textContent = tmaLength;

        recalcTMAFull();
    });

    /* ===================== SLIDER_ATR ===================== */
    const atrSlider = document.getElementById('atrSlider');
    const atrValue = document.getElementById('atrValue');

    atrSlider.value = atrPeriod;
    atrValue.textContent = atrPeriod;

    atrSlider.addEventListener('input', () => {
        atrPeriod = Number(atrSlider.value);
        atrValue.textContent = atrPeriod;

        recalcTMAFull();
    });


    /* ===================== SLIDER_MULTIPLIER ===================== */
    const multiplierSlider = document.getElementById('multiplierSlider');
    const multiplierValue = document.getElementById('multiplierValue');

    multiplierSlider.value = multiplier;
    multiplierValue.textContent = multiplier;

    multiplierSlider.addEventListener('input', () => {
        multiplier = Number(multiplierSlider.value);
        multiplierValue.textContent = multiplier;

        recalcTMAFull();
    });


    /* ===================== HISTORY ===================== */

    async function loadHistory() {
        const res = await fetch('/history?symbol=BTCUSDT&interval=15&limit=1000');
        candles = (await res.json()).filter(c => c.time);

        candleSeries.setData(candles);

        volumeSeries.setData(
            candles.map(c => ({
                time: c.time,
                value: c.volume ?? 0,
                color: c.close >= c.open ? '#26a69a' : '#ef5350'
            }))
        );

        recalcSMAFull();
        recalcTMAFull();
        recalcTMA2();
        recalcTMA3();

    }

    function recalcSMAFull() {
        smaData = calculateSMA(candles, smaPeriod);
        smaSeries.setData(smaData);
    }

    function recalcTMAFull() {
        if (!candles.length) return;

        const tmaUp = smoothLine(
            calculateTMA_UP(candles, tmaLength, atrPeriod, multiplier),
            5
        );

        const tmaDown = smoothLine(
        calculateTMA_DOWN(candles, tmaLength, atrPeriod, multiplier),
        5
        );

        tmaUpSeries.setData(tmaUp);
        tmaDownSeries.setData(tmaDown);
    }


    function recalcTMA2() {
    if (candles.length < 200) return;

    const up = smoothLine(
        calculateTMA_UP(candles, 96, 96, 5),
        5
    );

    const down = smoothLine(
        calculateTMA_DOWN(candles, 96, 96, 5),
        5
    );

    console.log('TMA2 points:', up.length);

    tmaUp2Series.setData(up);
    tmaDown2Series.setData(down);
    }


    function recalcTMA3() {
    if (candles.length < 200) return;

    const up = smoothLine(
        calculateTMA_UP(candles, 96, 96, 6),
        5
    );

    const down = smoothLine(
        calculateTMA_DOWN(candles, 96, 96, 6),
        5
    );

    console.log('TMA3 points:', up.length);

    tmaUp3Series.setData(up);
    tmaDown3Series.setData(down);
    }

    await loadHistory();

    /* ===================== REALTIME ===================== */

    const ws = new WebSocket(`ws://${location.host}/ws`);

    ws.onmessage = (event) => {
        const candle = JSON.parse(event.data);
        if (!candle?.time) return;

        const last = candles[candles.length - 1];
        const isNew = !(last && last.time === candle.time);

        if (isNew) candles.push(candle);
        else candles[candles.length - 1] = candle;

        candleSeries.update(candle);

        volumeSeries.update({
            time: candle.time,
            value: candle.volume ?? 0,
            color: candle.close >= candle.open ? '#26a69a' : '#ef5350'
        });

        /* ===== SMA realtime (update only) ===== */

        if (candles.length < smaPeriod) return;

        const slice = candles.slice(-smaPeriod);
        const value = slice.reduce((a, c) => a + c.close, 0) / smaPeriod;

        const smaPoint = {
            time: candle.time,
            value
        };

        smaSeries.update(smaPoint);

        if (isNew) smaData.push(smaPoint);
        else smaData[smaData.length - 1] = smaPoint;


        /* ===== Логика lastSMA с console.log ===== */
        const lastSMA = smaData[smaData.length - 1];
        if (!lastSMA || lastSMA.value == null || candle?.close == null) return;

        if (candle.close < lastSMA.value) {
            console.log('price < sma');
        } else if (candle.close > lastSMA.value) {
            console.log('price > sma');
        } else {
            console.log('price == sma');
        }

        /* ===== SIGNALS ===== */

        checkSMASignals({
            candle,
            smaData
        });
    };
})();
