const { Peer } = require('peerjs')
let peer;
let connection;
let peerChange = false
const join = () => {
    peer = new Peer()
    peer.on('open', (id) => {
        document.getElementById('session-id').innerText = id
    })
    peer.on('connection', (c) => {
        connection = c;
        console.log('connected')
        connection.on('open', () => {
            console.log('socket opened')
            connection.on('data', (data) => {
                console.log('got data')
                if (data.type === 'handshake') {
                    console.log('type is handshake')
                    const autoConnect = peer.connect(data.peerId)
                    autoConnect.on('open', () => {
                        console.log('autoconnect opened')
                        autoConnect.on('data', (data) => {
                            renderer.updateEditor(data)
                        })
                        connection = autoConnect
                    })
                } else {
                    renderer.updateEditor(data)
                }
            })
        })
    })
}
join()
const joinSession = (id) => {
    if (connection && connection.open) return;
    connection = peer.connect(id)
    connection.on('open', () => {
        connection.send({type: 'handshake', peerId: peer.id})
        connection.on('data', (data) => {
            updateEditor(data)
        })
    })
}
const sendCurrentEditorState = () => {
    if (connection && connection.open) {
        console.log('sent packet buffer');
        connection.send(JSON.stringify(renderer.logicDisplay.components));
        peerChange = false; // Reset peerChange after sending the current state.
    }
};