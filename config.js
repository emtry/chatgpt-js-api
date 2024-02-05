let config = {
    username: process.env.USERNAME || "", 
    password: process.env.PASSWORD || "", 
    process_workers: process.env.PROCESS_WORKERS || 2, 
    loglevel: process.env.LOGLEVEL || 'info', 
    proxy: process.env.PROXY || "", 
    timeout: process.env.TIMEOUT || 60000, 
    headless: process.env.HEADLESS || false, 
};

module.exports = config
