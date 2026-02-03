/* chartjs-integration.js
   Integration helpers for Chart.js (v4+).
   - initChart(canvas, dataset, opts)
   - updateChart(chart, newData, opts)
   The helper maps CSS variables to dataset colors so themes apply consistently.
*/

(function(global){
  const Ge = global.Ge || (global.Ge = {});
  const Chart = global.Chart;

  if (!Chart) {
    console.warn('Chart.js not found — include Chart.js to use chartjs-integration.js');
    return;
  }

  function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || undefined; }

  function initChart(canvas, data, opts = {}) {
    const accent = cssVar('--g-accent') || '#2563eb';
    const accent2 = cssVar('--g-accent-2') || '#06b6d4';
    const bg = cssVar('--g-surface') || '#fff';
    const fg = cssVar('--g-foreground') || '#091020';

    const defaultOpts = {
      type: 'line',
      data: {
        labels: data.labels || data.map((_,i)=>i+1),
        datasets: data.datasets || [{
          label: 'Series',
          data: data.values || data,
          fill: true,
          borderColor: accent,
          backgroundColor: accent + '33', // add alpha fallback
          pointBackgroundColor: bg,
          pointBorderColor: accent2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: fg } },
          tooltip: { enabled: true }
        },
        scales: {
          x: { ticks: { color: fg }, grid: { color: cssVar('--g-grid') } },
          y: { ticks: { color: fg }, grid: { color: cssVar('--g-grid') } }
        },
        animation: { duration: opts.duration || 600, easing: 'easeOutCubic' }
      }
    };

    const cfg = Object.assign({}, defaultOpts, opts.config || {});
    const chart = new Chart(canvas.getContext('2d'), cfg);
    return chart;
  }

  function updateChart(chart, newData, opts = {}) {
    if (newData.labels) chart.data.labels = newData.labels;
    if (newData.datasets) chart.data.datasets = newData.datasets;
    else if (newData.values && chart.data.datasets[0]) chart.data.datasets[0].data = newData.values;

    chart.update(Object.assign({ duration: opts.duration || 600, easing: opts.easing || 'easeOutCubic' }, opts.updateOptions || {}));
  }

  Ge.chartjs = Ge.chartjs || {};
  Ge.chartjs.initChart = initChart;
  Ge.chartjs.updateChart = updateChart;

  global.Ge = Ge;
})(window);
