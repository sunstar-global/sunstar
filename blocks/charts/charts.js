/* eslint-disable no-unused-vars */

import { loadChartJs } from '../../scripts/scripts.js';
import { readBlockConfig } from '../../scripts/lib-franklin.js';

function getNiceStepSize(maxValue, targetSteps = 6) {
  const roughStep = maxValue / targetSteps;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;

  let niceNormalized;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 2.5) niceNormalized = 2.5;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;

  return niceNormalized * magnitude;
}

function animateValueLabels(chart, duration = 600) {
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    chart.$labelAnimationProgress = progress;
    chart.draw();

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function generateBarChart(labels, data, config, block) {
  // eslint-disable-next-line no-undef
  Chart.defaults.font.family = 'Noto Sans, Noto Sans JP, sans-serif';

  const aspectRatio = config.aspectratio ? parseFloat(config.aspectratio) : 1.2;
  const canvas = document.createElement('canvas');
  block.appendChild(canvas);

  const lastIndex = data.length - 1;

  const finalMainData = data.map((v, i) => (i === lastIndex ? null : v));
  const finalLastBarData = data.map((v, i) => (i === lastIndex ? v : null));

  const initialMainData = data.map((v, i) => (i === lastIndex ? null : 0));
  const initialLastBarData = data.map((v, i) => (i === lastIndex ? 0 : null));
  let stepSize;
  if (config.stepsize === null || config.stepsize === undefined) {
    stepSize = getNiceStepSize(Math.max(...data) * 1.1);
  } else {
    stepSize = parseInt(config.stepsize, 10);
  }

  // check if max is define in config.scale if yes then use it otherwise calculate a nice max value based on data and step size
  const maxRounded = config.scale
    ? parseInt(config.scale, 10)
    : Math.ceil((Math.max(...data) * 1.1) / stepSize) * stepSize;

  const valueLabelPlugin = {
    id: 'valueLabelPlugin',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const progress = chart.$labelAnimationProgress ?? 0;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);

        meta.data.forEach((bar, index) => {
          const rawValue = dataset.rawValues?.[index];
          if (rawValue == null) return;

          const isLast = index === chart.data.labels.length - 1;
          const animatedValue = Math.round(rawValue * progress);
          const { x, y, base } = bar;

          ctx.save();
          ctx.globalAlpha = progress;
          ctx.textAlign = 'center';

          if (isLast) {
            ctx.font = '500 28px "Noto Sans", sans-serif';
            ctx.fillStyle = '#F28B2D';
            ctx.textBaseline = 'bottom';
            ctx.fillText(animatedValue.toLocaleString(), x, y - 10);
          } else {
            ctx.font = '500 24px "Noto Sans", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline = 'middle';
            ctx.fillText(animatedValue.toLocaleString(), x, y + (base - y) / 2);
          }

          ctx.restore();
        });
      });
    },
  };

  // eslint-disable-next-line no-undef
  const chart = new Chart(canvas, {
    type: 'bar',
    plugins: [valueLabelPlugin],
    data: {
      labels,
      datasets: [
        {
          data: initialMainData,
          rawValues: finalMainData,
          borderWidth: 0,
          borderRadius: 16,
          backgroundColor: ['#4D89A3', '#00577C', null],
          barPercentage: 0.8,
          grouped: false,
        },
        {
          data: initialLastBarData,
          rawValues: finalLastBarData,
          borderWidth: 0,
          borderRadius: 16,
          backgroundColor: [null, null, '#F28B2D'],
          barPercentage: 1,
          grouped: false,
        },
      ],
    },
    options: {
      aspectRatio,
      maintainAspectRatio: true,
      animation: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: maxRounded,
          ticks: {
            color: '#00587c',
            stepSize,
            maxValue: maxRounded,
            font: {
              size: 16,
            },
          },
          border: {
            width: 0,
          },
        },
        x: {
          ticks: {
            color: '#00587c',
            font: (ct) => {
              const isLastTick = ct.index === ct.chart.data.labels.length - 1;

              return {
                size: isLastTick ? 20 : 16,
                weight: isLastTick ? '600' : '400',
                family: 'Noto Sans, Noto Sans JP, sans-serif',
              };
            },
          },
          border: {
            width: 0,
          },
          grid: {
            drawTicks: true,
            tickLength: 8,
            display: false,
          },
        },
      },
    },
  });

  chart.$labelAnimationProgress = 0;

  let hasAnimated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || hasAnimated) return;
        if (entry.intersectionRatio < 0.65) return;

        hasAnimated = true;

        setTimeout(() => {
          // Reset instantly to bottom before animating
          chart.$labelAnimationProgress = 0;
          chart.data.datasets[0].data = [...initialMainData];
          chart.data.datasets[1].data = [...initialLastBarData];
          chart.update('none');

          // Animate bars from 0 to final values
          chart.options.animation = {
            duration: 1000,
            easing: 'easeOutCubic',
          };

          chart.data.datasets[0].data = [...finalMainData];
          chart.data.datasets[1].data = [...finalLastBarData];
          chart.update();

          // Start counting/fading labels after bars are almost done
          setTimeout(() => {
            animateValueLabels(chart, 600);
          }, 850);
        }, 120);

        observer.unobserve(entry.target);
      });
    },
    {
      threshold: [0.65],
    }
  );

  observer.observe(canvas);
}

function generateDoughnutChart(labels, data, config, block) {
  // eslint-disable-next-line no-undef
  Chart.defaults.font.family = 'Noto Sans, Noto Sans JP, sans-serif';

  const aspectRatio = config.aspectratio ? parseFloat(config.aspectratio) : 1.4;

  const canvas = document.createElement('canvas');
  block.appendChild(canvas);

  const colors = config.colors || ['#0099D4', '#00A89C'];
  const centerTextColor = config.centerTextColor || '#00577C';
  const labelColor = config.labelColor || '#00577C';
  const connectorColor = config.connectorColor || '#7A8A93';
  const dotColor = config.dotColor || '#2F3A40';

  const total = data.reduce((sum, value) => sum + value, 0);

  const customPlugin = {
    id: 'customDoughnutInsideLabels',
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      const meta = chart.getDatasetMeta(0);

      if (!meta?.data?.length) return;

      const arc = meta.data[0];
      const cx = arc.x;
      const cy = arc.y;
      const { outerRadius } = arc;

      ctx.save();

      // Center text
      ctx.fillStyle = centerTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = '400 14px "Noto Sans", sans-serif';
      ctx.fillText('Sales (%) by', cx, cy - 16);

      ctx.font = '700 18px "Noto Sans", sans-serif';
      ctx.fillText('Business', cx, cy + 2);
      ctx.fillText('Sector', cx, cy + 24);

      meta.data.forEach((segment, index) => {
        const angle = (segment.startAngle + segment.endAngle) / 2;
        const value = data[index];
        const percent = `${Math.round((value / total) * 100)}%`;

        const anchorX = cx + Math.cos(angle) * (outerRadius - 8);
        const anchorY = cy + Math.sin(angle) * (outerRadius - 8);

        const isRight = Math.cos(angle) >= 0;

        // Keep everything inside chart area
        const dotX = isRight ? cx + outerRadius + 18 : cx - outerRadius - 18;
        const dotY = anchorY;

        const lineEndX = isRight ? dotX + 22 : dotX - 22;
        const textX = isRight ? lineEndX + 8 : lineEndX - 8;

        // Connector
        ctx.beginPath();
        ctx.strokeStyle = connectorColor;
        ctx.lineWidth = 1.5;
        ctx.moveTo(anchorX, anchorY);
        ctx.lineTo(dotX, dotY);
        ctx.lineTo(lineEndX, dotY);
        ctx.stroke();

        // Dot
        ctx.beginPath();
        ctx.fillStyle = dotColor;
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = labelColor;
        ctx.textAlign = isRight ? 'left' : 'right';

        ctx.font = '400 13px "Noto Sans", sans-serif';
        ctx.fillText(labels[index], textX, dotY - 12);

        ctx.font = '700 18px "Noto Sans", sans-serif';
        ctx.fillText(percent, textX, dotY + 10);
      });

      ctx.restore();
    },
  };

  // eslint-disable-next-line no-undef
  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 0,
          radius: '78%', // makes doughnut smaller
        },
      ],
    },
    options: {
      aspectRatio,
      maintainAspectRatio: true,
      cutout: '60%',
      layout: {
        padding: {
          top: 30,
          right: 90,
          bottom: 30,
          left: 90,
        },
      },
      animation: {
        animateRotate: true,
        duration: 800,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    },
    plugins: [customPlugin],
  });
}

function getDataFromBlock(block) {
  const labels = [];
  const data = [];
  const rows = Array.from(block.children);

  const dataStartIndex = rows.findIndex((row) => {
    const firstCell = row.children[0];
    return firstCell && firstCell.textContent.trim().toLowerCase() === 'data';
  });

  if (dataStartIndex === -1) {
    return { labels, data };
  }

  for (let i = dataStartIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const cells = row.children;

    if (cells.length >= 2) {
      const label = cells[0].textContent.trim();
      const value = parseFloat(cells[1].textContent.trim());

      if (label) labels.push(label);
      if (!Number.isNaN(value)) data.push(value);
    }
  }

  return { labels, data };
}

export default async function decorate(block) {
  await loadChartJs();

  const blockCfg = readBlockConfig(block);

  const { labels, data } = getDataFromBlock(block);

  Array.from(block.children).forEach((child) => {
    block.removeChild(child);
  });

  if (blockCfg.title) {
    const titleContainer = document.createElement('div');
    titleContainer.classList.add('chart-title-container');

    const titleEl = document.createElement('h3');
    titleEl.textContent = blockCfg.title;
    titleContainer.appendChild(titleEl);

    if (blockCfg.caption) {
      const captionEl = document.createElement('p');
      captionEl.textContent = `${blockCfg.caption}`;
      titleEl.appendChild(captionEl);
    }

    block.appendChild(titleContainer);
  }

  if (blockCfg.type === 'doughnut') {
    generateDoughnutChart(labels, data, blockCfg, block);
    return;
  }

  if (blockCfg.type === 'bar') {
    generateBarChart(labels, data, blockCfg, block);
  }
}
