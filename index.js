/**
 * 作者: emtry
 * 日期: 2024-02-02
 */

const login = require('./util/login');
const completions = require("./util/completions");


(async () => {
   
    let browser = await login();

    await completions(browser);

})();