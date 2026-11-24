import { getBlockedSites, getTodayStats } from '../shared/storage.js';

const walls = document.querySelector('#walls');
const wallTime = document.querySelector('#wall-time');
const skips = document.querySelector('#skips');
const siteCount = document.querySelector('#site-count');

render().catch((error) => {
  console.error('Blank Wall dashboard failed:', error);
});

async function render() {
  const [stats, sites] = await Promise.all([getTodayStats(), getBlockedSites()]);
  walls.textContent = String(stats.walls);
  wallTime.textContent = `${Math.round(stats.wallSeconds / 60)} min`;
  skips.textContent = String(stats.skips);
  siteCount.textContent = String(sites.length);
}
