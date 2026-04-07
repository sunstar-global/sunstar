/* eslint-disable no-unused-vars */

import { loadChartJs } from '../../scripts/scripts.js';
import { readBlockConfig } from '../../scripts/lib-franklin.js';

function generateBarChart(labels, data, config, block) {
  const canvas = document.createElement('canvas');
  canvas.ctx = canvas.getContext('2d');
  block.appendChild(canvas);
  let title = {};
  if (config.title) {
    title = {
      display: true,
      text: config.title,
      position: 'top',
      align: 'start',
      color: '#00587c',
      font: {
        size: 24,
        weight: 'normal',
      },
      padding: {
        top: 10,
        bottom: 30,
      },
    };
  }

  // chck what is the max value in data and set stepSize accordingly to have around 6 steps in y axis + 10% buffer on top
  const stepSize = Math.ceil(Math.max(...data) / 6) + Math.ceil(Math.max(...data) / 10);

  // set the last bar to be thicker if it has the max value, otherwise all bars will have the same thickness
  const barTicknessArray = data.map((value) => (value === Math.max(...data) ? 60 : 90));

  const lastIndex = data.length - 1;
  const mainData = data.map((v, i) => (i === lastIndex ? null : v));
  const mainLabels = labels.map((v, i) => (i === lastIndex ? '' : v));
  const lastBarData = data.map((v, i) => (i === lastIndex ? v : null));
  const lastBarLabel = labels.map((v, i) => (i === lastIndex ? v : ''));

  const ctx = canvas;

  // eslint-disable-next-line no-undef, no-new
  const chart = new Chart(ctx, {
    type: 'bar',
    title: 'Chart Title',
    aspectRatio: 1,
    data: {
      stacked: true,
      labels,
      datasets: [
        {
          data: mainData,
          borderWidth: 0,
          borderRadius: 16,
          backgroundColor: ['#4D89A3', '#00577C'],
          barThickness: 60,
          grouped: false,
        },
        {
          data: lastBarData,
          borderWidth: 0,
          borderRadius: 16,
          backgroundColor: '#F28B2D',
          barThickness: 90,
          grouped: false,
        },
      ],
    },
    options: {
      plugins: {
        title: { ...title },
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#00587c',
            stepSize,
          },
          border: {
            width: 0,
          },
        },
        x: {
          ticks: {
            color: '#00587c',
          },
          border: {
            width: 0,
          },
          grid: {
            display: false,
          },
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
  const blockCfg = readBlockConfig(block);

  console.log(blockCfg);

  const { labels, data } = getDataFromBlock(block);
  generateBarChart(labels, data, blockCfg, block);
  // remove everything except canvas element from block
  Array.from(block.children).forEach((child) => {
    if (child.tagName.toLowerCase() !== 'canvas') {
      block.removeChild(child);
    }
  });
}
