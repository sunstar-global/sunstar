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

function animateDoughnutLabels(chart, duration = 300) {
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

function setupDoughnutViewportAnimation(chart, observedEl, drawDuration = 800, labelDelay = 700, threshold = 0.6) {
  chart.$labelAnimationProgress = 0;

  chart.data.datasets.forEach((dataset) => {
    dataset.circumference = 0;
  });
  chart.update('none');

  let hasAnimated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || hasAnimated) return;
        if (entry.intersectionRatio < threshold) return;

        hasAnimated = true;

        // Draw donut ring from 0 -> 360deg, then fade labels in.
        chart.$labelAnimationProgress = 0;
        chart.options.animation = {
          animateRotate: true,
          duration: drawDuration,
          easing: 'easeOutCubic',
        };

        chart.data.datasets.forEach((dataset) => {
          dataset.circumference = 360;
        });
        chart.update();

        setTimeout(() => {
          animateDoughnutLabels(chart, 300);
        }, labelDelay);

        observer.unobserve(entry.target);
      });
    },
    {
      threshold: [threshold],
    }
  );

  observer.observe(observedEl);
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
            color: '#3c46501f',
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
            color: '#3c46501f',
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

  const aspectRatio = config.aspectratio ? parseFloat(config.aspectratio) : 1.1;
  const MOBILE_BREAKPOINT = 560;

  const canvasWrap = document.createElement('div');
  canvasWrap.classList.add('doughnut-canvas-wrap');
  canvasWrap.style.aspectRatio = String(aspectRatio);
  const canvas = document.createElement('canvas');
  canvasWrap.appendChild(canvas);
  block.appendChild(canvasWrap);

  // HTML legend shown below on mobile
  const legendEl = document.createElement('div');
  legendEl.classList.add('doughnut-legend');
  block.appendChild(legendEl);

  const chartColors = Array.isArray(colors) && colors.length > 0 ? colors : ['#0099D4', '#00A89C'];
  const outerLayerColors = chartColors.map((color) => withOpacity(color, 0.2));
  const centerTextColor = config.centerTextColor || '#00577C';
  const centerCaption = (config['caption-chart'] || '').trim() || '';
  const centerTitle = (config['title-chart'] || '').trim() || '';
  const labelColor = config.labelColor || '#00577C';
  const connectorColor = config.connectorColor || '#3c46501f';
  const configuredBorderColor =
    typeof config['border-color'] === 'string' && config['border-color'].trim() ? config['border-color'].trim() : null;

  const total = data.reduce((sum, value) => sum + value, 0);

  // Build HTML legend items once
  labels.forEach((label, i) => {
    const percent = `${Math.round((data[i] / total) * 100)}%`;
    const item = document.createElement('div');
    item.classList.add('doughnut-legend-item');
    const dot = document.createElement('span');
    dot.classList.add('doughnut-legend-dot');
    dot.style.backgroundColor = chartColors[i] || chartColors[0];
    const labelSpan = document.createElement('span');
    labelSpan.classList.add('doughnut-legend-label');
    labelSpan.textContent = label;
    const valueSpan = document.createElement('span');
    valueSpan.classList.add('doughnut-legend-value');
    valueSpan.textContent = percent;
    item.append(dot, labelSpan, valueSpan);
    legendEl.appendChild(item);
  });

  const isMobile = () => block.offsetWidth < MOBILE_BREAKPOINT;

  const getLayoutPadding = () =>
    isMobile() ? { top: 4, right: 4, bottom: 4, left: 4 } : { top: 4, right: 0, bottom: 4, left: 0 };

  const customPlugin = {
    id: 'customDoughnutInsideLabels',
    afterDraw(chart) {
      const { ctx } = chart;
      const outerMeta = chart.getDatasetMeta(0);
      const mainMeta = chart.getDatasetMeta(1) || outerMeta;
      const labelProgress = chart.$labelAnimationProgress ?? 1;

      if (!mainMeta?.data?.length) return;

      const arc = mainMeta.data[0];
      const cx = arc.x;
      const cy = arc.y;

      ctx.save();

      // Center text — always drawn
      ctx.fillStyle = centerTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = '400 14px "Noto Sans", sans-serif';
      ctx.fillText(centerCaption, cx, cy - 16);

      const titleWords = centerTitle.split(/\s+/).filter(Boolean);
      const titleLines =
        titleWords.length > 1
          ? [
              titleWords.slice(0, Math.ceil(titleWords.length / 2)).join(' '),
              titleWords.slice(Math.ceil(titleWords.length / 2)).join(' '),
            ]
          : [centerTitle];

      ctx.font = '700 18px "Noto Sans", sans-serif';
      if (titleLines.length === 1) {
        ctx.fillText(titleLines[0], cx, cy + 12);
      } else {
        ctx.fillText(titleLines[0], cx, cy + 2);
        ctx.fillText(titleLines[1], cx, cy + 24);
      }

      // Side labels only on desktop
      if (isMobile()) {
        ctx.restore();
        return;
      }

      ctx.globalAlpha = labelProgress;

      mainMeta.data.forEach((segment, index) => {
        const angle = (segment.startAngle + segment.endAngle) / 2;
        const value = data[index];
        const percent = `${Math.round((value / total) * 100)}%`;

        const ringAnchorRadius = segment.innerRadius + (segment.outerRadius - segment.innerRadius) * 0.7;
        const anchorX = cx + Math.cos(angle) * ringAnchorRadius;
        const anchorY = cy + Math.sin(angle) * ringAnchorRadius;

        const isRight = Math.cos(angle) >= 0;

        const dotX = isRight ? cx + segment.outerRadius + 18 : cx - segment.outerRadius - 18;
        const dotY = anchorY;
        const lineEndX = isRight ? dotX + 22 : dotX - 22;
        const textX = isRight ? lineEndX + 10 : lineEndX - 10;

        // Connector line
        ctx.beginPath();
        ctx.strokeStyle = connectorColor;
        ctx.lineWidth = 1.5;
        ctx.moveTo(anchorX, anchorY);
        ctx.lineTo(dotX, dotY);
        ctx.lineTo(lineEndX, dotY);
        ctx.stroke();

        // Dot at connector origin on the ring
        ctx.beginPath();
        ctx.fillStyle = labelColor;
        ctx.arc(anchorX, anchorY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Label text
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
          circumference: 0,
          ...(configuredBorderColor ? { borderColor: configuredBorderColor } : {}),
          radius: '69%',
          cutout: '80%',
          weight: 1,
        },
        {
          data,
          backgroundColor: chartColors,
          spacing: 0,
          borderWidth: 2,
          circumference: 0,
          borderColor: configuredBorderColor || '#ffffff',
          radius: '78%',
          cutout: '60%',
          weight: 1,
        },
      ],
    },
    options: {
      events: [],
      elements: { arc: { borderWidth: 0 } },
      rotation: 0,
      aspectRatio: isMobile() ? 1 : aspectRatio,
      maintainAspectRatio: true,
      layout: { padding: getLayoutPadding() },
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
    plugins: [customPlugin],
  });

  chart.$labelAnimationProgress = 0;

  const updateLegendVisibility = () => {
    const mobile = isMobile();
    legendEl.classList.toggle('is-visible', mobile);
    legendEl.setAttribute('aria-hidden', mobile ? 'false' : 'true');
  };

  // Sync legend visibility and chart options on resize
  const resizeObserver = new ResizeObserver(() => {
    const mobile = isMobile();
    updateLegendVisibility();
    chart.options.layout.padding = getLayoutPadding();
    chart.options.aspectRatio = mobile ? 1 : aspectRatio;
    canvasWrap.style.aspectRatio = String(mobile ? 1 : aspectRatio);
    chart.update('none');
  });

  resizeObserver.observe(block);

  // Set initial legend visibility
  updateLegendVisibility();

  setupDoughnutViewportAnimation(chart, canvasWrap, 800, 700, 0.6);
}

function generateCustomDoughnutChart(labels, data, colors, config, block) {
  // eslint-disable-next-line no-undef
  Chart.defaults.font.family = 'Noto Sans, Noto Sans JP, sans-serif';

  const aspectRatio = config.aspectratio ? parseFloat(config.aspectratio) : 1;

  // Fallback color palette for items without a specified color
  const FALLBACK_COLORS = [
    '#B8D4E0',
    '#C5DDE6',
    '#A0C8D8',
    '#7BAFC4',
    '#D2E6EC',
    '#5E9AB5',
    '#DCEEF3',
    '#6BA5BC',
    '#8FBFCE',
    '#AAD0DC',
    '#E6F3F7',
    '#3A7A9B',
  ];
  let fallbackIdx = 0;
  const resolvedColors = labels.map((_, i) => {
    if (colors[i]) return colors[i];
    const c = FALLBACK_COLORS[fallbackIdx % FALLBACK_COLORS.length];
    fallbackIdx += 1;
    return c;
  });

  const total = data.reduce((s, v) => s + v, 0);

  // Identify Scope 1+2 position to build the 2-segment outer ring
  const scope12Index = labels.findIndex((l) => /scope\s*1\s*\+\s*2/i.test(l));
  const scope12Value = scope12Index >= 0 ? data[scope12Index] : 0;
  const scope3Value = total - scope12Value;

  // Outer ring: Scope 1+2 (dark teal) | Scope 3 aggregate (orange)
  // Aligned to the inner ring by matching the first segment's position
  const outerData =
    scope12Index === 0
      ? [scope12Value, scope3Value]
      : [...data.slice(0, scope12Index).map(() => 0), scope12Value, scope3Value];

  const OUTER_SCOPE12 = '#00577C';
  const OUTER_SCOPE3 = '#F28B2D';
  const outerColors =
    scope12Index === 0
      ? [OUTER_SCOPE12, OUTER_SCOPE3]
      : [...Array(scope12Index).fill('transparent'), OUTER_SCOPE12, OUTER_SCOPE3];

  const centerTextColor = config.centerTextColor || '#00577C';
  const centerCaption = (config['caption-chart'] || '').trim();
  const centerTitle = (config['title-chart'] || '').trim();

  const canvasWrap = document.createElement('div');
  canvasWrap.classList.add('doughnut-canvas-wrap');
  canvasWrap.style.aspectRatio = String(aspectRatio);
  const canvas = document.createElement('canvas');
  canvasWrap.appendChild(canvas);
  block.appendChild(canvasWrap);

  // Legend rendered below the chart (always visible)
  const legendEl = document.createElement('div');
  legendEl.classList.add('doughnut-custom-legend');
  block.appendChild(legendEl);

  labels.forEach((label, i) => {
    const commaIdx = label.indexOf(',');
    const scopeName = commaIdx >= 0 ? label.slice(0, commaIdx).trim() : label;
    const description = commaIdx >= 0 ? label.slice(commaIdx + 1).trim() : '';
    const displayPercent = `${data[i]}%`;

    const item = document.createElement('div');
    item.classList.add('doughnut-custom-legend-item');

    const swatch = document.createElement('span');
    swatch.classList.add('doughnut-custom-legend-swatch');
    swatch.style.backgroundColor = resolvedColors[i];

    const nameEl = document.createElement('div');
    nameEl.classList.add('doughnut-custom-legend-name');
    nameEl.textContent = scopeName;

    const descEl = document.createElement('div');
    descEl.classList.add('doughnut-custom-legend-desc');
    descEl.textContent = description;

    const valueEl = document.createElement('div');
    valueEl.classList.add('doughnut-custom-legend-value');
    valueEl.textContent = displayPercent;

    item.append(swatch, nameEl, descEl, valueEl);
    legendEl.appendChild(item);
  });

  // Helper: wrap text to fit within maxWidth
  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    words.forEach((word) => {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);
    return lines;
  }

  // Plugin: draw center caption + title inside the donut hole
  const centerPlugin = {
    id: 'customDoughnutCenter',
    afterDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(1);
      const labelProgress = chart.$labelAnimationProgress ?? 1;
      if (!meta?.data?.length) return;

      const arc = meta.data[0];
      const { x: cx, y: cy, innerRadius } = arc;
      const maxTextWidth = innerRadius * 1.5;

      ctx.save();
      ctx.globalAlpha = labelProgress;
      ctx.fillStyle = centerTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      const captionFontSize = Math.max(10, Math.min(13, innerRadius * 0.17));
      const titleFontSize = Math.max(12, Math.min(18, innerRadius * 0.23));
      const captionLineHeight = captionFontSize * 1.35;
      const gap = 6;

      ctx.font = `400 ${captionFontSize}px "Noto Sans", sans-serif`;
      const captionLines = wrapText(ctx, centerCaption, maxTextWidth);
      const captionBlockH = captionLines.length * captionLineHeight;

      const totalH = captionBlockH + gap + titleFontSize;
      let y = cy - totalH / 2 + captionLineHeight;

      captionLines.forEach((line) => {
        ctx.fillText(line, cx, y);
        y += captionLineHeight;
      });

      y += gap;
      ctx.font = `700 ${titleFontSize}px "Noto Sans", sans-serif`;
      ctx.fillText(centerTitle, cx, y);

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
          // Outer thin ring: Scope 1+2 vs Scope 3 aggregate
          data: outerData,
          backgroundColor: outerColors,
          circumference: 0,
          borderWidth: 0,
          radius: '69%',
          cutout: '80%',
          weight: 1,
        },
        {
          // Inner ring: all individual scope segments
          data,
          backgroundColor: resolvedColors,
          circumference: 0,
          borderWidth: 2,
          borderColor: '#ffffff',
          radius: '78%',
          cutout: '58%',
          weight: 1,
        },
      ],
    },
    options: {
      events: [],
      aspectRatio,
      maintainAspectRatio: true,
      rotation: 0,
      layout: { padding: 8 },
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    },
    plugins: [centerPlugin],
  });

  setupDoughnutViewportAnimation(chart, canvasWrap, 800, 700, 0.6);
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

  if (blockCfg.type === 'doughnut-custom') {
    generateCustomDoughnutChart(labels, data, colors, blockCfg, block);
    return;
  }

  if (blockCfg.type === 'doughnut') {
    generateDoughnutChart(labels, data, colors, blockCfg, block);
    return;
  }

  if (blockCfg.type === 'bar') {
    generateBarChart(labels, data, colors, blockCfg, block, isSmallText);
  }
}
