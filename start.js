const http = require('http');
const app = require('./app');

const httpServer = http.createServer(app);
require("./sockets/index")(httpServer);

httpServer.listen(8000, () => {
	console.log('HTTP Server running on port 8000');
});