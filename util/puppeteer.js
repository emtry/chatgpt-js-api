const config = require("../config")
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const pathToExtension = path.join(__dirname, '../plugin/tampermonkey_stable');
puppeteer.use(StealthPlugin());

let puppeteerConfig = {
    headless: config.headless,
    args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    `--proxy-server=${config.proxy}`,
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
    ],
    executablePath: executablePath(),
    userDataDir: path.join(__dirname, '../UserData')
}
module.exports = {
    puppeteer,
    puppeteerConfig
}