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

function withOpacity(color, opacity = 0.5) {
  if (!color || typeof color !== 'string') return color;

  const hex = color.trim();
  const normalizedOpacity = Math.max(0, Math.min(1, opacity));

  // #RGB, #RGBA, #RRGGBB, #RRGGBBAA -> rgba(r, g, b, a)
  if (hex.startsWith('#')) {
    let value = hex.slice(1);

    if (value.length === 3 || value.length === 4) {
      value = value
        .split('')
        .slice(0, 3)
        .map((ch) => ch + ch)
        .join('');
    } else if (value.length === 8) {
      value = value.slice(0, 6);
    }

    if (value.length === 6) {
      const r = Number.parseInt(value.slice(0, 2), 16);
      const g = Number.parseInt(value.slice(2, 4), 16);
      const b = Number.parseInt(value.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${normalizedOpacity})`;
    }
  }

  // rgb() -> rgba(); rgba() -> replace alpha.
  const rgbMatch = hex.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const channels = rgbMatch[1].split(',').map((part) => part.trim());
    if (channels.length >= 3) {
      return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${normalizedOpacity})`;
    }
  }

  return color;
}

function generateBarChart(labels, data, colors, config, block, isSmallText = false) {
  // eslint-disable-next-line no-undef
  Chart.defaults.font.family = 'Noto Sans, Noto Sans JP, sans-serif';

  const chartColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#4D89A3', '#00577C', '#F28B2D'];

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
      const lastBarFontSize = isSmallText ? 22 : 28;
      const otherBarFontSize = isSmallText ? 18 : 24;

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
            ctx.font = `500 ${lastBarFontSize}px "Noto Sans", sans-serif`;
            ctx.fillStyle = '#F28B2D';
            ctx.textBaseline = 'bottom';
            ctx.fillText(animatedValue.toLocaleString(), x, y - 10);
          } else {
            ctx.font = `500 ${otherBarFontSize}px "Noto Sans", sans-serif`;
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
          backgroundColor: chartColors.map((color, i) => (i === lastIndex ? '#F28B2D' : color)),
          barPercentage: 0.8,
          grouped: false,
        },
        {
          data: initialLastBarData,
          rawValues: finalLastBarData,
          borderWidth: 0,
          borderRadius: 16,
          backgroundColor: chartColors.map((color, i) => (i === lastIndex ? '#F28B2D' : color)),
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
              size: isSmallText ? 13 : 16,
            },
          },
          grid: {
            display: false,
          },
          border: {
            color: '#4D89A3',
            width: 1,
          },
        },
        x: {
          ticks: {
            color: '#00587c',
            font: (ct) => {
              const isLastTick = ct.index === ct.chart.data.labels.length - 1;

              return {
                // eslint-disable-next-line no-nested-ternary
                size: isLastTick ? (isSmallText ? 16 : 20) : isSmallText ? 13 : 16,
                weight: isLastTick ? '600' : '400',
                family: 'Noto Sans, Noto Sans JP, sans-serif',
              };
            },
          },
          border: {
            color: '#4D89A3',
            width: 1,
          },
          grid: {
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

function generateDoughnutChart(labels, data, colors, config, block) {
  // eslint-disable-next-line no-undef
  Chart.defaults.font.family = 'Noto Sans, Noto Sans JP, sans-serif';

  const aspectRatio = config.aspectratio ? parseFloat(config.aspectratio) : 1.4;

  const canvas = document.createElement('canvas');
  block.appendChild(canvas);

  const chartColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#0099D4', '#00A89C'];
  const outerLayerColors = chartColors.map((color) => withOpacity(color, 0.2));
  const centerTextColor = config.centerTextColor || '#00577C';
  const labelColor = config.labelColor || '#00577C';
  const connectorColor = config.connectorColor || '#3c46501f';

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

        // Keep labels close to the ring, similar to the design reference
        const dotX = isRight ? cx + outerRadius + 10 : cx - outerRadius - 10;
        const dotY = anchorY;

        const lineEndX = isRight ? dotX + 16 : dotX - 16;
        const textX = isRight ? lineEndX + 6 : lineEndX - 6;

        // Connector
        ctx.beginPath();
        ctx.strokeStyle = connectorColor;
        ctx.lineWidth = 1.5;
        ctx.moveTo(anchorX, anchorY);
        ctx.lineTo(dotX, dotY);
        ctx.lineTo(lineEndX, dotY);
        ctx.stroke();

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
          backgroundColor: outerLayerColors,
          spacing: 0,
          borderWidth: 2,
          radius: '69%',
          cutout: '80%',
          weight: 1,
        },
        {
          data,
          backgroundColor: chartColors,
          spacing: 0,
          borderWidth: 2,
          borderColor: '#ffffff',
          radius: '78%',
          cutout: '60%',
          weight: 1,
        },
      ],
    },
    options: {
      events: [],
      elements: {
        arc: {
          borderWidth: 0,
        },
      },
      aspectRatio,
      maintainAspectRatio: true,
      layout: {
        padding: {
          top: 30,
          right: 70,
          bottom: 30,
          left: 70,
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
  const colors = [];
  const rows = Array.from(block.children);

  const dataStartIndex = rows.findIndex((row) => {
    const firstCell = row.children[0];
    return firstCell && firstCell.textContent.trim().toLowerCase() === 'data';
  });

  if (dataStartIndex === -1) {
    return { labels, data, colors };
  }

  for (let i = dataStartIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const cells = row.children;

    if (cells.length >= 2) {
      const label = cells[0].textContent.trim();
      const value = parseFloat(cells[1].textContent.trim());
      const color = cells[2]?.textContent.trim();

      if (label) labels.push(label);
      if (!Number.isNaN(value)) data.push(value);
      if (color) colors.push(color);
    }
  }

  return { labels, data, colors };
}

export default async function decorate(block) {
  await loadChartJs();

  const blockCfg = readBlockConfig(block);
  const isSmallText = block.classList.contains('small-text');

  const { labels, data, colors } = getDataFromBlock(block);

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
    generateDoughnutChart(labels, data, colors, blockCfg, block);
    return;
  }

  if (blockCfg.type === 'bar') {
    generateBarChart(labels, data, colors, blockCfg, block, isSmallText);
  }
}
