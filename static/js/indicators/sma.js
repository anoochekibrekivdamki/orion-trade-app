export function calculateSMA(data, period = 14) {
    const result = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push({
                time: data[i].time,
                value: null,
            });
        } else {
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) {
                sum += data[j].close;
            }
            result.push({
                time: data[i].time,
                value: sum / period,
            });
        }
    }

    return result;
}
