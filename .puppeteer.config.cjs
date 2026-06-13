const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Directs Puppeteer to store the browser binary locally in the project
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
