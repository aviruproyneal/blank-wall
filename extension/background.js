import { initializeStorage } from './shared/storage.js';

chrome.runtime.onInstalled.addListener(() => {
  initializeStorage().catch((error) => {
    console.error('Blank Wall storage initialization failed:', error);
  });
});
