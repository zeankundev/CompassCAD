const { Peer } = require('peerjs')
let peer;
let connection;
let peerChange = false
var doupdatestack = true

const join = () => {
    peer = new Peer()
    peer.on('open', (id) => {
        document.getElementById('session-id').innerText = id
    })
    peer.on('connection', (c) => {
        connection = c;
        console.log(c)
        console.log('connected')
        client.setActivity({
            details: 'Working on a collaborated design',
            state: `ID: ${c.peer}`,
            largeImageKey: 'logo_round',
            smallImageKey: 'work_multi',
            startTimestamp: new Date().now
        })
        document.getElementById('peer-connected').style.display = 'block'
        setTimeout(() => {
            document.getElementById('peer-connected').style.display = 'none'
        }, 2000)
        connection.on('open', () => {
            callToast('A new participant has joined!')
            console.log('socket opened')
            connection.on('data', (data) => {
                console.log('got data')
                if (data.type === 'handshake') {
                    console.log('type is handshake')
                    const autoConnect = peer.connect(data.peerId)
                    autoConnect.on('open', () => {
                        console.log('autoconnect opened')
                        autoConnect.on('data', (data) => {
                            console.log(data)
                            doupdatestack = false
                            renderer.updateEditor(data)
                        })
                        connection = autoConnect
                    })
                } else {
                    doupdatestack = false
                    renderer.updateEditor(data)
                }
            })
        })
    })
}
join()
const joinSession = (id) => {
    console.log('asking to join session')
    if (connection && connection.open) return;
    connection = peer.connect(id)
    connection.on('open', () => {
        connection.send({type: 'handshake', peerId: peer.id})
        connection.on('data', (data) => {
            doupdatestack = false
            updateEditor(data)
        })
    })
    connection.on('error', (e) => {
        diag.showErrorBox(
            `Failed to connect to peer`, 
            `CompassCAD failed to connect to your multi-edit session. Try:\n
            - asking the host to retry their instance\n
            - checking your internet connection\n
            - double-checking the session ID that was given`)
        throw new Error(e)
    })
}
const sendCurrentEditorState = () => {
    if (connection && connection.open) {
        console.log('sent packet buffer')
        connection.send(JSON.stringify(renderer.logicDisplay.components))
    }
}