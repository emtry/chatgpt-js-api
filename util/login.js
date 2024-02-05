const {
    puppeteer,
    puppeteerConfig
} = require('./puppeteer');
const config = require("../config");
const logger = require('./log');


async function login() {
    let browser;
    try {
        browser = await puppeteer.launch(puppeteerConfig);

       
        logger.info("打开 ChatGPT");
        chatGPTPage = await browser.newPage();
        logger.debug("Starting new HTTP connection: https://chat.openai.com");
        const response = await chatGPTPage.goto("https://chat.openai.com");
        if (response.status() === 200) {
            logger.debug(response.url() + " " + response.request().method() + " " + response.status());
        } else {
            logger.error(response.url() + " " + response.request().method() + " " + response.status());
        }
       

        await chatGPTPage.evaluate(() => {
            window.sessionStatuscode = false;
        });

        // 监听响应
        const networkData = [];
        chatGPTPage.on('response', async (response) => {
            const url = response.url();
            if (url.includes('https://chat.openai.com/api/auth/session')) {
                const status = response.status();
                if (status === 200 || status === 429) {
                    // 设置标志变量
                    await chatGPTPage.evaluate((status) => {
                        window.sessionStatuscode = status;
                    }, status);
                }
            }
        });
        
        await Promise.race([
            chatGPTPage.waitForSelector('#__next > div.flex.min-h-full.w-screen.flex-col.sm\:supports-\[min-height\:100dvh\]\:min-h-\[100dvh\].md\:grid.md\:grid-cols-2.lg\:grid-cols-\[60\%_40\%\] > div.relative.flex.grow.flex-col.items-center.justify-between.bg-white.px-5.py-8.text-black.dark\:bg-black.dark\:text-white.sm\:rounded-t-\[30px\].md\:rounded-none.md\:px-6 > div.relative.flex.w-full.grow.flex-col.items-center.justify-center > div > div > button:nth-child(1)').then(() => isLogin = 0),
            chatGPTPage.waitForSelector('#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col > div.flex-1.overflow-hidden > div > div.absolute.left-0.right-0 > div > div.flex.items-center.gap-2').then(() => isLogin = 1)
        ]);

        const pages = await browser.pages();
      for (let i = 0; i < pages.length; i++) {
          const url = pages[i].url();
          if (!url.includes("chat.openai.com")) {
              await pages[i].close();
          }
      }
await chatGPTPage.waitForSelector('#__next > div.relative.z-0.flex.h-full.w-full.overflow-hidden > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden > main > div.flex.h-full.flex-col > div.flex-1.overflow-hidden > div > div.absolute.left-0.right-0 > div > div.flex.items-center.gap-2').then(() => isLogin = 1);


        if (isLogin == 0) {
            let loginbuttonSelector = "#__next button:nth-child(1)";
            await waitForSelector(chatGPTPage, loginbuttonSelector);
            logger.debug("点击登录按钮");
            await chatGPTPage.click(loginbuttonSelector);


            let usernameSelector = '#username';
            await waitForSelector(chatGPTPage, usernameSelector);
            logger.debug("输入账号");
            await insertText(chatGPTPage, usernameSelector, config.username);


            await new Promise((resolve) => {
                const delay = Math.random() * (5000 - 2000) + 2000;
                setTimeout(() => {
                    resolve();
                }, delay);
            });
            logger.debug("点击继续按钮");
            await chatGPTPage.keyboard.press('Enter');


            let passwordSelector = '#password';
            await waitForSelector(chatGPTPage, passwordSelector);
            logger.debug("输入密码");
            await insertText(chatGPTPage, passwordSelector, config.password);


            await new Promise((resolve) => {
                const delay = Math.random() * (5000 - 2000) + 2000;
                setTimeout(() => {
                    resolve();
                }, delay);
            });
            logger.debug("点击继续按钮");
            await chatGPTPage.keyboard.press('Enter');
        }





        let textareaSelector = '#prompt-textarea';
        await waitForSelector(chatGPTPage, textareaSelector);
        const statusCode = await chatGPTPage.waitForFunction(() => {
            return window.sessionStatuscode === 200 || window.sessionStatuscode === 429;
        }, {
            timeout: config.timeout
        }).then(() => chatGPTPage.evaluate(() => window.sessionStatuscode));
        if (statusCode === 429) {
            logger.warn('Error: 429 Too Many Requests');
        } 
    } catch (error) {
        logger.error(error);
    } finally {
        if (browser) {
            return browser;
        }
    }
       
}


async function waitForSelector(page, selector) {
    // 初始化点计数器
    let dotsCount = 0;
    const maxDots = 5; // 最大点数，之后循环

    // 开始循环输出点
    let dotsInterval = setInterval(() => {
        process.stdout.write('\r' + '.'.repeat(dotsCount));
        dotsCount = (dotsCount + 1) % (maxDots + 2);

        // 用空格覆盖整行，然后回车以重新开始
        if (dotsCount === 0) {
            process.stdout.write('\r' + ' '.repeat(maxDots + 1) + '\r');
        }
    }, 1000); // 每秒更新一次

    try {
        await page.waitForSelector(selector, {
            visible: true,
            timeout: config.timeout
        });

        // 清除点输出循环
        clearInterval(dotsInterval);

        // 清除已经输出的点
        process.stdout.write('\r' + ' '.repeat(maxDots) + '\r');

        // 在selector出现后执行的其他操作...
        process.stdout.write('✓');
        // 随机延迟后“删除”打勾符号
        await new Promise((resolve) => {
            // 生成一个 2000 到 5000 毫秒的随机数
            const delay = Math.random() * (5000 - 2000) + 2000;
            setTimeout(() => {
                // 使用回车符和空格来覆盖打勾符号，然后再用回车符返回行首
                process.stdout.write('\r \r');
                resolve();
            }, delay);
        });

    } catch (error) {
        clearInterval(dotsInterval); // 如果出现错误或超时，也要清除循环
        // 清除已经输出的点
        process.stdout.write('\r' + ' '.repeat(maxDots) + '\r');
        // console.error('An error occurred or timeout reached waiting for ' + selector, error);
    }
}

async function insertText(page, selector, text) {
    try {
        await page.type(selector, text);
    } catch (error) {
        logger.error("插入文本时发生错误: " + error);
    }
}

module.exports = login;