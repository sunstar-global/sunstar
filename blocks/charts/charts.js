/* eslint-disable no-unused-vars */

import { loadChartJs } from '../../scripts/scripts.js';

function generateBarChart(labels, data, block) {
  // append script inside head to load chart.js

  // create canvas element
  const canvas = document.createElement('canvas');
  canvas.ctx = canvas.getContext('2d');
  block.appendChild(canvas);

  const ctx = canvas;
  // eslint-disable-next-line no-undef
  const mychart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data,
          borderWidth: 1,
          backgroundColor: ['#4D89A3', '#00577C', '#F28B2D'],
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function getDataFromBlock(block) {
  const labels = [];
  const data = [];

  const rows = Array.from(block.children);

  // 1. Find index of "Data" row
  const dataStartIndex = rows.findIndex((row) => {
    const firstCell = row.children[0];
    return firstCell && firstCell.textContent.trim().toLowerCase() === 'data';
  });

  if (dataStartIndex === -1) {
    return { labels, data };
  }

  // 2. Loop through rows AFTER "Data"
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
  const { labels, data } = getDataFromBlock(block);
  generateBarChart(labels, data, block);
  // remove everything except canvas element from block
  Array.from(block.children).forEach((child) => {
    if (child.tagName.toLowerCase() !== 'canvas') {
      block.removeChild(child);
    }
  });
}
