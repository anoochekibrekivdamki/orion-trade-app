import { calculateSMA } from './sma.js';

export function calculateTRIMA(data, period = 96) {
    if (!data || data.length === 0) return [];

    const sma1 = calculateSMA(data, period); // первая SMA
    const trima = [];

    const offset = Math.floor((period - 1) / 2); // центрирование

    for (let i = 0; i < data.length; i++) {
        // индекс в SMA1 сдвигаем на offset, чтобы последняя свеча была включена
        const idx = i - offset;
        const value = (idx >= 0 && idx < sma1.length) ? sma1[idx].value : null;
        trima.push({ time: data[i].time, value });
    }

    return trima;
}
