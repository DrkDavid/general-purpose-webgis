import { resizeMap } from "../map/map_utils.js";

const leftPanel = document.getElementById('left-panel');
const rightPanel = document.getElementById('right-panel');
const leftToggle = document.getElementById('left-panel-toggle');
const rightToggle = document.getElementById('right-panel-toggle');

leftToggle.addEventListener('click', () => {
  leftPanel.classList.toggle('collapsed');
  const icon = leftToggle.querySelector('i');
  icon.classList.toggle('fa-chevron-left');
  icon.classList.toggle('fa-chevron-right');
  resizeMap();
});

rightToggle.addEventListener('click', () => {
  rightPanel.classList.toggle('collapsed');
  const icon = rightToggle.querySelector('i');
  icon.classList.toggle('fa-chevron-right');
  icon.classList.toggle('fa-chevron-left');
  resizeMap();
});