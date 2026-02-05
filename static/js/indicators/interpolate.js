export function smoothLine(data, smoothPeriod = 3) {
    const result = [];

    for (let i = 0; i < data.length; i++) {
        // Берём последние smoothPeriod значений
        const window = data.slice(Math.max(0, i - smoothPeriod + 1), i + 1)
                           .map(d => d.value)
                           .filter(v => v != null);

        // Считаем среднее
        const avg = window.length ? window.reduce((a, b) => a + b, 0) / window.length : null;

        result.push({ time: data[i].time, value: avg });
    }

    return result;
}
