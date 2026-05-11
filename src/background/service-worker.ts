import { initScheduler } from '../scheduler/sunset';
chrome.runtime.onInstalled.addListener(() => { initScheduler(); });
chrome.runtime.onStartup.addListener(() => { initScheduler(); });
