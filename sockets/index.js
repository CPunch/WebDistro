const sockio = require("socket.io");
const crypto = require("crypto");
const pty = require("node-pty");

let currentTerms = {};
var currentConnections = {};

module.exports = function(server) {
    const io = sockio(server);

    function createConnection(client)
    {
        currentConnections[client.id] = {socket: client};
    }

    function closeConnection(client)
    {
        if (currentConnections[client.id] == null)
            return false;

        leaveTerminal(client);

        delete currentConnections[client.id];
    }

    function leaveTerminal(client)
    {
        if (currentConnections[client.id].session != null)
        {
            var id = currentConnections[client.id].session.id;

            client.leave(id);
            
            delete currentConnections[client.id].session;
            
            if (currentTerms[id] != null)
            {
                delete currentTerms[id].users[client.id];
                if (Object.keys(currentTerms[id].users).length <= 0)
                {
                    console.log("closing " + id);
                    closeTerminal(id);
                }
            }
        }
    }

    function joinTerminal(client, id, pass)
    {
        leaveTerminal(client);

        if (currentTerms[id])
        {
            if (currentTerms[id].pass != crypto.createHash("sha256").update(pass).digest('hex'))
                return 2; // invlaid password hash
            
            client.join(id, function(){
                currentConnections[client.id].session = {id: id, raw: currentTerms[id]};
                currentTerms[id].users[client.id] = client;

                // send buffer to client, the client will now play catch-up
                client.emit('data', currentTerms[id].buffer);
            });

            return null;
        }
        return 1; // session doesn't exist
    }

    function closeTerminal(id)
    {
        if (currentTerms[id] == null)
            return false;

        // TODO: this might maybe be a bad idea to directly pass id??? hmm not sure, maybe change?
        //      possible solution: gen session ids for them, remove id input all together.
        pty.spawn('docker', ['rm', '-f', id]);
        
        currentTerms[id].term.kill()
        delete currentTerms[id];
    }

    function createTerminal(client, id, pass, type)
    {
        if (currentTerms[id])
            return 3; // session already exists

        // decode type to image, if it exists
        var image = "";
        switch (type)
        {
            case 0: // ubuntu
                image = "ubuntu";
                break;
            case 1: // debian
                image = "debian"
                break;
            case 2: // fedora
                image = "fedora"
                break;
            default:
                return 4; // image not avalible
        }

        currentTerms[id] = {users: {}};
        currentTerms[id].pass = crypto.createHash("sha256").update(pass).digest('hex'); // hash pass to compare later
        currentTerms[id].buffer = "";
        
        // TODO: this might maybe be a bad idea to directly pass id??? hmm not sure, maybe change?
        currentTerms[id].term = pty.spawn('docker', ['run', '-ti', '--name', id, '--memory=100M', '--cpus=1', '--rm', image, 'bash'], {
            name: 'xterm-256color',
            cols: 120,
            rows: 24,
            cwd: __dirname
        });

        currentTerms[id].term.on('data', function(data) {
            // send data to clients connected to this terminal
            io.to(id).emit('data', data);

            // save to buffer
            currentTerms[id].buffer = currentTerms[id].buffer + data;
        });

        // make sure docker container is cleared and cleaned when terminal is killed
        currentTerms[id].term.on('exit', function() {
            closeTerminal(id);
        });

        currentTerms[id].term.write('clear\n', function(){
            switch(type)
            {
                case 0:
                    currentTerms[id].term.write('# run \'apt update\' before installing packages\n');
                    break;
            }
        });
        currentTerms[id].users[client.id] = client;

        return joinTerminal(client, id, pass);
    }

    io.on('connection', function(client) {
        createConnection(client);

        client.on('disconnect', function() {
            closeConnection(client);
        });

        client.on('data', function(data) {
            if (typeof(data) == "string" && currentConnections[client.id].session != null)
                currentConnections[client.id].session.raw.term.write(data);
        });
        
        client.on('resize', function(size) {
            if (currentConnections[client.id].session != null)
                currentConnections[client.id].session.raw.term.resize(size.cols, size.rows);
        });

        client.on('joinSession', function(sess, pass, callback) {
            callback(joinTerminal(client, sess, pass));
        });

        client.on('newSession', function(sess, pass, type, callback) {
            callback(createTerminal(client, sess, pass, type));
        });
    });
};