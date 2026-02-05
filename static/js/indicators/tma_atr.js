import { calculateTRIMA } from './trima.js';
import { calculateATR } from './atr.js';

/**
 * Рассчитывает TMA_UP для каждой свечи так, чтобы последняя свеча была включена в расчёт.
 * @param {Array} data - массив свечей {time, open, high, low, close, volume}
 * @param {number} periodTMA - период TRIMA
 * @param {number} periodATR - период ATR
 * @param {number} multiplier - множитель ATR
 * @returns {Array} - массив {time, value} той же длины, что data
 */
export function calculateTMA_UP(data, periodTMA = 100, periodATR = 110, multiplier = 6) {
    if (!data || data.length === 0) return [];

    const tma = calculateTRIMA(data, periodTMA); // TRIMA считает для каждой свечи
    const atr = calculateATR(data, periodATR);   // ATR считает для каждой свечи
    const result = [];

    for (let i = 0; i < data.length; i++) {
        const tmaVal = tma[i]?.value ?? null;
        const atrVal = atr[i]?.value ?? null;

        // только если оба значения реально рассчитаны
        const value = (tmaVal !== null && atrVal !== null) ? tmaVal + multiplier * atrVal : null;

        result.push({ time: data[i].time, value });
    }

    return result;
}
