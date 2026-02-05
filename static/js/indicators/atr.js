import { calculateSMA } from './sma.js';

/**
 * Calculate ATR (Average True Range)
 * @param {Array} data массив свечей {time, open, high, low, close}
 * @param {number} period период ATR (обычно 14)
 * @returns {Array} массив {time, value} для графика
 */
export function calculateATR(data, period = 14) {
    if (!data || data.length < 2) return [];

    const trValues = [];

    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            // для первой свечи просто high - low
            trValues.push(data[i].high - data[i].low);
        } else {
            const prevClose = data[i - 1].close;
            const tr = Math.max(
                data[i].high - data[i].low,
                Math.abs(data[i].high - prevClose),
                Math.abs(data[i].low - prevClose)
            );
            trValues.push(tr);
        }
    }

    // приводим к формату {time, close}, чтобы использовать нашу функцию SMA
    const trData = data.map((c, idx) => ({
        time: c.time,
        close: trValues[idx],
    }));

    // вычисляем SMA от TR
    const atrData = calculateSMA(trData, period);

    // преобразуем в {time, value} для LightweightCharts
    return atrData.map(p => ({
        time: p.time,
        value: p.value ?? null,
    }));
}
