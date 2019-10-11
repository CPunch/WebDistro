const express = require('express');
const path = require('path');

var app = express();

app.use('/libs/font-awesome', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/')));
app.use('/libs/xterm', express.static(path.join(__dirname, 'node_modules/xterm/lib/')));
app.use('/libs/xterm', express.static(path.join(__dirname, 'node_modules/xterm/css/')));
app.use('/libs/xterm/fit', express.static(path.join(__dirname, 'node_modules/xterm-addon-fit/lib/')));
app.use(express.static(path.join(__dirname, 'public')));

const router = express.Router();

router.get('*', (req, res) => {
	res.send(path.join(__dirname, 'public/index.html'))
});

module.exports = app;