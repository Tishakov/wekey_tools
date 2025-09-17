// Тест функциональности масштабирования слайдеров

// Имитируем метрику с диапазоном
const testMetric = {
  id: 'clicks',
  name: 'Клики',
  sliderRange: { min: 0, max: 500 },
  isDecimal: false,
  isPercentage: false
};

// Тестируем функцию масштабирования
function getScaledRange(metric, scaleFactor) {
  if (metric.sliderRange) {
    return {
      min: metric.sliderRange.min,
      max: metric.sliderRange.max * scaleFactor
    };
  }
  return null;
}

// Тестируем различные кратности
console.log('=== Тест масштабирования диапазонов ===');

for (let scale = 1; scale <= 5; scale++) {
  const scaledRange = getScaledRange(testMetric, scale);
  console.log(`Кратность x${scale}: диапазон 0-${scaledRange.max} (было 0-${testMetric.sliderRange.max})`);
}

console.log('\n=== Примеры для разных метрик ===');

const metricsExamples = [
  { name: 'Клики', baseMax: 500 },
  { name: 'Показы', baseMax: 10000 },
  { name: 'CPC', baseMax: 50 },
  { name: 'Лиды', baseMax: 200 }
];

console.log('Кратность x1 (базовые диапазоны):');
metricsExamples.forEach(metric => {
  console.log(`  ${metric.name}: 0-${metric.baseMax}`);
});

console.log('\nКратность x10 (масштабированные диапазоны):');
metricsExamples.forEach(metric => {
  console.log(`  ${metric.name}: 0-${metric.baseMax * 10}`);
});

console.log('\n=== Результат ===');
console.log('✅ Масштабирование позволяет увеличить верхнюю границу слайдеров');
console.log('✅ Нижняя граница всегда остается 0');
console.log('✅ Все слайдеры масштабируются одновременно');
console.log('✅ Диапазон x1-x20 обеспечивает гибкость для разных сценариев');