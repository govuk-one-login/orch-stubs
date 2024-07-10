import * as http from "node:http";

http.createServer(function (req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h2 style="text-align: center;">Hello World</h2>');
}).listen(8080);
