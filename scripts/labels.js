const LABEL_TARGET_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, div';
const LABEL_MARKER_PATTERN = /^(?:labels?|categories?|category labels?)\s*:\s*(.+)$/i;

function parseLabels(text) {
  const labelMatch = String(text || '')
    .trim()
    .match(LABEL_MARKER_PATTERN);
  if (!labelMatch) return [];

  const seen = new Set();
  return labelMatch[1]
    .split(/[,|/]/)
    .map((label) => label.trim())
    .filter((label) => {
      const key = label.toLowerCase();
      if (!label || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function createLabels(labels) {
  const labelGroup = document.createElement('div');
  labelGroup.className = 'content-labels';

  labels.forEach((label) => {
    const labelElement = document.createElement('span');
    labelElement.className = 'content-label';
    labelElement.textContent = label;
    labelGroup.append(labelElement);
  });

  return labelGroup;
}

function hasLabels(element) {
  return (
    element.querySelector(':scope > .content-labels') ||
    element.nextElementSibling?.classList.contains('content-labels')
  );
}

function getLabelTarget(marker) {
  let target = marker.previousElementSibling;

  while (target && !target.textContent.trim()) {
    target = target.previousElementSibling;
  }

  return target?.matches(LABEL_TARGET_SELECTOR) ? target : null;
}

function decorateLabels(root) {
  root.querySelectorAll('p').forEach((marker) => {
    const labels = parseLabels(marker.textContent);
    if (!labels.length) return;

    const target = getLabelTarget(marker);
    if (!target || hasLabels(target)) return;

    target.classList.add('has-content-labels');
    target.append(createLabels(labels));
    marker.remove();
  });
}

export default decorateLabels;
