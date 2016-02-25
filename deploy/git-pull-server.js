if (this.Meteor) return;

var http = require('http'),
    port = process.env['GIT_PULL_SERVER_PORT'] || 3030,
    spawn = require('child_process').spawn;

const pathToSources = process.env['GIT_PULL_SERVER_PATH'] || "/adminbase",
      gitCommand = '/git-pull-server/do-pull.sh',
      tag = process.env['GIT_PULL_TAG'] || 'devtest';


var commandCount = 0;
var server = http.createServer(function (_unused_request, response) {
  if (commandCount > 0) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.end("Command already pending\n");
  } else {
      commandCount += 1;
  }
  var subprocess = spawn(gitCommand, [pathToSources, tag], {
      stdio: "inherit",
  });
  subprocess.on("exit", function() {
      commandCount = 0;
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.end("KTHXBAI\n");
  });
});

server.listen(port);
