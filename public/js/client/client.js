$(function(){
    let socket = io();
    let currentSession = null;
    
    // ===== UI STUFF =====

    let infoMenu = $('#infoModal');
    
    let tabBanner = document.getElementById("tabBanner");

    // joingame
    let joinSessInput = document.getElementById("joinSessInput");
    let joinNameInput = document.getElementById("joinNameInput");
    let joinKeyInput = document.getElementById("joinKeyInput");
    let joinButton = document.getElementById("joinSessButton");

    // newgame
    let newSessInput = document.getElementById("newSessInput");
    let newNameInput = document.getElementById("newNameInput");
    let newKeyInput = document.getElementById("newKeyInput");
    let newImageInput = document.getElementById("newImageInput");
    let newImageIcon = document.getElementById("newImageIcon");
    let newButton = document.getElementById("newSessButton");

    function modalError(msg)
    {
        tabBanner.className = "banner banner-error";
        tabBanner.innerHTML = msg;
    }

    function showErrorCode(e)
    {
        switch(e)
        {
            case 1:
                return modalError("Session ID doesn't exist!");
            case 2:
                return modalError("Invalid password!");
            case 3:
                return modalError("Session ID already exists!");
            case 4:
                return modalError("Invalid base image!");
            default:
                modalError("Unkn err");
        }
    }

    newImageInput.onchange = function()
    {
        switch(parseInt(newImageInput.value))
        {
            case 0: // ubuntu
                newImageIcon.className = "fab fa-ubuntu";
                break;
            case 1: // Debian
                newImageIcon.className = "fab fa-debian"
                break;
            case 2: // Fedora
                newImageIcon.className = "fab fa-fedora";
                break;s
        }
    }

    joinButton.onclick = function()
    {
        var session = joinSessInput.value;
        var passcode = joinKeyInput.value;

        if ((session && session.length > 0) && (passcode && passcode.length > 0)) 
        {
            socket.emit("joinSession", session, passcode, function(r)
            {
                if (r)
                {
                    showErrorCode(r);
                }
                else
                {
                    currentSession = session;
                    $('#infoModal').modal('hide');
                }
            });
        }
        else
        {
            modalError("All fields are required!");
        }
    }

    newButton.onclick = function()
    {
        var session = newSessInput.value;
        var passcode = newKeyInput.value;

        if ((session && session.length > 0) && (passcode && passcode.length > 0)) 
        {
            socket.emit("newSession", session, passcode, parseInt(newImageInput.value), function(r)
            {
                if (r)
                {
                    showErrorCode(r);
                }
                else
                {
                    currentSession = session;
                    $('#infoModal').modal('hide');
                }
            });
        }
        else
        {
            modalError("All fields are required!");
        }
    }

    // ===== SOCKET & GAME STUFF ======

    var termElem = document.getElementById("terminal");

    let term = new Terminal({
        cols: 120,
        rows: 120,
        cursorBlink: true,
        'theme': { 
            background: '#282828',
            foreground: '#FBF1C7',
            black: '#282828',
            white: '#FBF1C7',
            brightRed: '#FB4934',
            brightGreen: '#B8BB26',
            brightYellow: '#FABD2F',
            brightBlue: '#83A598',
            brightMagenta: '#D3869B',
            brightCyan: '#8EC07C',
            red: '#CC241D',
            green: '#98971A',
            yellow: '#D79921',
            blue: '#458588',
            magenta: '#B16286',
            cyan: '#689D6A',

        }
    });

    var fitAddon = new FitAddon.FitAddon()
    term.loadAddon(fitAddon);
    term.open(document.getElementById("terminal"));
    fitAddon.fit();

    socket.on('connect', function() {
        term.onData(function(data) {
            socket.emit('data', data);
        });
        
        term.onResize(function(size) {
            socket.emit('resize', size)
        });
        
        socket.on('data', function(data) {
            term.write(data);
        });
        
        socket.on('disconnect', function() {
            term.clear();
            term.write("Session Closed :(\n")
        });
        
        term.clear();
        fitAddon.fit();
    });

    // show after stuff is done loading lol
    infoMenu.modal({
        backdrop: 'static',
        keyboard: false  // to prevent closing with Esc button (if you want this too)
    });
    $('.modal-backdrop').removeClass("modal-backdrop");
});