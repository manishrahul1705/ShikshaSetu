const base=require('./playwright.ps.config');
module.exports={...base,testMatch:'ps-pages.spec.js',repeatEach:1,timeout:600000,reporter:[['list'],['json',{outputFile:'docs/screenshots/ps-story/page-results.json'}]]};
