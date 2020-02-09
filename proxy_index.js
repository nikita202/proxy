const http = require("http");
const net = require("net");
const url = require("url");
const process = require("process");


function generateHttpResponse(response) {
    response = response.toString();
    return `HTTP/1.1 200 OK\n` +
        `Date: ${new Date().toUTCString()}\n` +
        `Server: Apache/2.2.14 (Win32)\n` +
        `Last-Modified: ${new Date().toUTCString()}\n` +
        `Content-Length: ${response.length}\n` +
        `Content-Type: text/plain\n` +
        `Connection: Closed\n\n` +
        response;
}

net.createServer(function (socket) {
    let request = "";
    socket.on("data", data => {
        //console.log(data.toString());
        request += data.toString();
        if (request.endsWith("\r\n\r\n")) {
            end(request);
        }
        //console.log(encodeURI(request));
    });
    socket.on("error", console.log);

    function end(request) {
        console.log("-------------------------------------------------\nRequest:\n" + request);
        let [header, ...requestEnd] = request.split("\r\n");
        let [requestType, requestUrl, protocol] = header.split(" ");
        if (requestUrl.indexOf("://") === -1) requestUrl = "http://" + requestUrl;
        console.log(`Connecting to ${requestUrl} via ${protocol}...`);
        //socket.write(generateHttpResponse(`Connecting to ${url} via ${protocol}...`));
        let parsed = url.parse(requestUrl);
        console.log("[end] requestUrl=" + requestUrl);
        console.log("[end] parsed=" + JSON.stringify(parsed));
        let connection = net.createConnection(parseInt(parsed.port || "80"), parsed.hostname, () => {});
        if (requestType === "CONNECT") {
            socket.write("HTTP/1.1 200 Connection Established\r\nProxy-agent: Kar\r\n\r\n");
            socket.pipe(connection, {end: false});
            connection.pipe(socket, {end: false});
        } else {
            connection.on("error", console.log);
            connection.write(`${requestType} ${parsed.path} ${protocol}\r\n${requestEnd.join("\r\n")}`);
            connection.pipe(socket);
        }
    }
}).listen(8080);
