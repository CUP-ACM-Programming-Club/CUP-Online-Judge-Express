# CUP-Online-Judge-Express
[![Build Status](https://travis-ci.com/CUP-ACM-Programming-Club/CUP-Online-Judge-Express.svg?branch=master)](https://travis-ci.com/CUP-ACM-Programming-Club/CUP-Online-Judge-Express)
[![](https://img.shields.io/github/license/CUP-ACM-Programming-Club/CUP-Online-Judge-Express.svg)](https://github.com/CUP-ACM-Programming-Club/CUP-Online-Judge-Express/blob/master/LICENSE)
[![codebeat badge](https://codebeat.co/badges/bf69c0eb-2bdf-4fbe-a6f0-2bf2a98a597a)](https://codebeat.co/projects/github-com-cup-acm-programming-club-cup-online-judge-express-master-7e8760db-7670-4c22-9862-1262dddcb4ec)
[![codecov](https://codecov.io/gh/CUP-ACM-Programming-Club/CUP-Online-Judge-Express/branch/master/graph/badge.svg)](https://codecov.io/gh/CUP-ACM-Programming-Club/CUP-Online-Judge-Express)
[![](https://img.shields.io/badge/platform-Linux-red.svg)]()
![](https://img.shields.io/badge/language-JavaScript-orange.svg)
<a href="https://996.icu"><img src="https://img.shields.io/badge/link-996.icu-red.svg"></a>

CUP Online Judge后端模块

请使用git clone到本地安装

### Requirements
* Ubuntu 16.04 or later(Recommend)
* Node.js 10(LTS) or later(LTS)
* MySQL 5.7 or later
* Redis latest
* CUP-Online-Judge-Judger(when judger needed)

### Install dependencies
``npm install``

### Run HTTP Server cluster
``npm start``

### Stop HTTP Server cluster
``npm stop``

### Run Websocket Daemon(Not cluster)
```npm run websocket:start```

### Stop Websocket Daemon(Not cluster)
```npm run websocket:stop```

### Run Program
``npm run front``

### Debug
``npm run debug``

