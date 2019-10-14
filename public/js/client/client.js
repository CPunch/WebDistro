$(function(){
    let socket = io();
    
    // ===== UI STUFF =====

    let infoMenu = $('#infoModal');
    
    let tabBanner = document.getElementById("tabBanner");
    let termThemeInput = document.getElementById("termThemeInput");

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

    // Terminal themes
    const Term_Themes = {
        ["Gruvbox Dark"]: { 
            background: '#282828',
            foreground: '#FBF1C7',
            black: '#282828',
            white: '#FBF1C7',
            red: '#CC241D',
            green: '#98971A',
            yellow: '#D79921',
            blue: '#458588',
            magenta: '#B16286',
            cyan: '#689D6A',
            cursor: "#FBF1C7"
        },
        ["Gruvbox Light"]: { 
            background: '#FBF1C7',
            foreground: '#3C3836',
            black: '#282828',
            white: '#FBF1C7',
            red: '#FB4934',
            green: '#B8BB26',
            yellow: '#FABD2F',
            blue: '#83A598',
            magenta: '#D3869B',
            cyan: '#8EC07C',
            cursor: "#3C3836"
        }, 
        ["Solarized Dark"]: {
            background: '#002b36',
            foreground: '#93a1a1',
            black: '#002b36',
            white: '#93a1a1',
            red: '#dc322f',
            green: '#859900',
            yellow: '#b58900',
            blue: '#268bd2',
            magenta: '#d33682',
            cyan: '#2aa198',
            cursor: "#93a1a1"
        }
    }

    Object.keys(Term_Themes).forEach(function(key){
        var option = document.createElement("option");
        option.innerText = key;
        option.value = key;
        termThemeInput.appendChild(option);
    });

    function updateTheme(theme)
    {
        document.body.style.background = Term_Themes[theme].background;
        term.setOption("theme", Term_Themes[theme]);
    }

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
                newImageIcon.className = "fab fa-debian"; // curse you fontawesome!!!!!!!!!!!!!!
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
        'theme': Term_Themes["Gruvbox Dark"]
    });

    termThemeInput.onchange = function()
    {
        updateTheme(termThemeInput.value)
    }

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
    
    updateTheme("Gruvbox Dark");

    // show after stuff is done loading lol
    infoMenu.modal({
        backdrop: 'static',
        keyboard: false  // to prevent closing with Esc button (if you want this too)
    });
    $('.modal-backdrop').removeClass("modal-backdrop");

});