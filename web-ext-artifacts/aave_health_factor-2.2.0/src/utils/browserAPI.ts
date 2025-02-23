/// <reference types="webextension-polyfill" />
declare const browser: typeof chrome;

const browserAPI = {
  storage: typeof browser !== 'undefined' ? browser.storage : chrome.storage,
  runtime: typeof browser !== 'undefined' ? browser.runtime : chrome.runtime,
  alarms: typeof browser !== 'undefined' ? browser.alarms : chrome.alarms,
  action: typeof browser !== 'undefined' ? browser.action : chrome.action
};

export default browserAPI; 