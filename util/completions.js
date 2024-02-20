const config = require("../config");
const express = require('express');
const cors = require('cors');
const path = require('path');
const EventEmitter = require('events');
const logger = require('./log');

async function completions(browser) {
    const browserManager = new BrowserManager(browser);
    await browserManager.initPages(config.process_workers);

    const app = express();
    const PORT = 8081;
    app.use(express.json());
    app.use(cors());
    app.listen(PORT, () => {
        logger.info(`Server is running on http://localhost:${PORT}`);
    });


    app.post('/v1/chat/completions', async (req, res) => {
        logger.info("new request");
        logger.debug("request: " + JSON.stringify(req.body));
        logger.info("model: " + req.body.model);
        logger.info("message: " + JSON.stringify(req.body.messages));
        
        
        const chatGPTPage = await browserManager.getFreePage();
        try {
            await chatGPTPage.evaluate(async (reqbody) => {
                await chatgpt.send(JSON.stringify(reqbody.messages));
            }, req.body);

            await new Promise((resolve) => {
                const delay = 2000;
                setTimeout(() => {
                    resolve();
                }, delay);
            });


            // no stream
            if (!req.body.stream){
                const result = await chatGPTPage.evaluate(async () => {
                    await chatgpt.isIdle();
                    return {
                        all: await chatgpt.getChatData('active', 'all', 'chatgpt', 'latest'),
                        msg: await chatgpt.getChatData('active', 'msg', 'chatgpt', 'latest')
                    };
                });
    
                let msg = Array.isArray(result.msg) ? result.msg.join("\n") : result.msg
                let response = {
                    "choices": [{
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {
                            "content": msg,
                            "role": "assistant"
                        }
                    }],
                    "created": new Date(result.all.update_time).getTime(),
                    "id": "chatcmpl-" + result.all.id,
                    "model": "gpt-4",
                    "object": "chat.completion",
                    "system_fingerprint": null,
                    "usage": {
                        "prompt_tokens":0,
                        "completion_tokens":0,
                        "total_tokens":0
                    }
                }
                
                res.json(response);

                logger.debug("response: " + JSON.stringify(response));
                logger.info("response message: " + msg);

                browserManager.markPageAsIdle(chatGPTPage);
            } else if (req.body.stream){ // stream
                const keepAliveInterval = 30000; // 30秒发送一次心跳

                // 设置SSE响应头
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                
                let msg;
                let response = {
                    "choices": [{
                        "index": 0,
                        "finish_reason": null,
                        "delta": {
                            "role": "assistant",
                            "content": "."
                        }
                    }],
                    "created": null,
                    "id": null,
                    "model": "gpt-4",
                    "object": "chat.completion",
                    "system_fingerprint": null,
                    "usage": {
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0
                    }
                };

                // 发送心跳的函数
                const sendHeartbeat = () => {
                    res.write("data: "+ JSON.stringify(response) + "\n\n");
                };
                
                // 开始定时发送心跳
                const heartbeatInterval = setInterval(sendHeartbeat, keepAliveInterval);
                
                try {
                    const result = await chatGPTPage.evaluate(async () => {
                        await chatgpt.isIdle();
                        return {
                            all: await chatgpt.getChatData('active', 'all', 'chatgpt', 'latest'),
                            msg: await chatgpt.getChatData('active', 'msg', 'chatgpt', 'latest')
                        };
                    });
                    
                    msg = Array.isArray(result.msg) ? result.msg.join("\n") : result.msg;
                    
                    response.choices[0].finish_reason = "stop";
                    response.choices[0].delta.content = msg;
                    response.created = new Date(result.all.update_time).getTime();
                    response.id = result.all.id;
                    
                    // 发送响应数据
                    res.write("data: "+ JSON.stringify(response) + "\n\n");
                } catch (error) {
                    // 记录错误并发送错误信息
                    logger.error(error);
                } finally {
                    clearInterval(heartbeatInterval);
                    res.write('data: [DONE]')
                    res.end();
                    
                    // 记录响应和消息
                    logger.debug("response: " + JSON.stringify(response));
                    logger.info("response message: " + msg);
                    
                    // 标记页面为闲置，以供再次使用
                    browserManager.markPageAsIdle(chatGPTPage);
                }
            }

        } catch (error) {
            logger.error(error);
            browserManager.markPageAsIdle(chatGPTPage);
        }

        req.on('close', async () => {
            logger.info("stop");
            res.end();
            await chatGPTPage.evaluate(async () => {
                await chatgpt.stop();
            });
            browserManager.markPageAsIdle(chatGPTPage);
        });
    });
}


class BrowserManager extends EventEmitter {
    constructor(browser) {
        super(); // 初始化 EventEmitter
        this.browser = browser;
        this.pages = [];
        this.pageIdleFlags = [];
    }

    async initPages(pageCount) {
        const pagePromises = [];
        for (let i = 0; i < pageCount; i++) {
            // 收集所有页面创建的Promise
            pagePromises.push((async () => {
                const page = await this.browser.newPage();
                await page.goto("https://chat.openai.com/?model=gpt-4");
                await page.addScriptTag({
                    path: path.join(__dirname, 'chatgpt.js')
                });
                this.pages.push(page);
                this.pageIdleFlags.push(true); // 初始时，所有页面都标记为空闲
            })());
        }
        await Promise.all(pagePromises); // 等待所有页面都创建完成
    }

    async getFreePage() {
        // 尝试查找一个空闲的页面
        for (let i = 0; i < this.pageIdleFlags.length; i++) {
            if (this.pageIdleFlags[i]) {
                this.pageIdleFlags[i] = false; // 标记页面为忙碌
                return this.pages[i];
            }
        }
        // 如果没有找到空闲的页面，等待一个页面变为空闲
        return new Promise(resolve => {
            this.once('pageIdle', () => resolve(this.getFreePage()));
        });
    }

    async markPageAsIdle(page) {
        await page.goto("https://chat.openai.com/?model=gpt-4");
        await page.addScriptTag({
            path: path.join(__dirname, 'chatgpt.js')
        });        
        const index = this.pages.indexOf(page);
        if (index !== -1) {
            this.pageIdleFlags[index] = true;
            this.emit('pageIdle'); // 触发页面空闲的事件
        }
    }
}

module.exports = completions;