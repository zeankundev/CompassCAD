const { Peer } = require('peerjs');
var doupdatestack = false;

class P2PNetwork {
  constructor() {
    this.peer = null;
    this.connections = new Map(); // Track all connections by peerId
    this.doupdatestack = true;
    this.knownPeers = new Set(); // Track all known peers to avoid duplicate connections
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 2000; // ms
    this.pingInterval = 30000; // ms
    this.messageQueue = new Map(); // Buffer messages for peers with connection issues
    this.maxQueueSize = 100;
  }

  initialize() {
    this.peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ],
        sdpSemantics: 'unified-plan'
      },
      debug: 0, // Set higher for debugging (1-3)
    });

    this.setupPeerEventListeners();
    return this.peer;
  }

  setupPeerEventListeners() {
    this.peer.on('open', (id) => {
      document.getElementById('session-id').innerText = id;
      console.log(`Peer initialized with ID: ${id}`);
      
      // Start periodic connection health checks
      setInterval(() => this.checkConnectionsHealth(), this.pingInterval);
    });

    this.peer.on('connection', (conn) => this.handleIncomingConnection(conn));
    
    this.peer.on('error', (error) => {
      console.error('Peer error:', error);
      this.handlePeerError(error);
    });
    
    this.peer.on('disconnected', () => {
      console.log('Disconnected from server, attempting to reconnect...');
      setTimeout(() => this.peer.reconnect(), 1000);
    });
  }

  handleIncomingConnection(conn) {
    console.log(`Incoming connection from ${conn.peer}`);
    
    conn.on('open', () => {
      this.addConnection(conn);

      document.getElementById('peer-connected').style.display = 'block';
      setTimeout(() => {
        document.getElementById('peer-connected').style.display = 'none';
      }, 2000);
      
      // Show connection notification
      this.showConnectionNotification(conn.peer);
      
      // Setup connection event listeners
      this.setupConnectionListeners(conn);
      
      // Share network information with the new peer
      this.shareNetworkInfo(conn);
    });
  }

  addConnection(conn) {
    if (!this.connections.has(conn.peer)) {
      this.connections.set(conn.peer, {
        connection: conn,
        lastActive: Date.now(),
        status: 'active',
        reconnectAttempts: 0
      });
      this.knownPeers.add(conn.peer);
      
      console.log(`Added connection to peer ${conn.peer}. Total connections: ${this.connections.size}`);
    }
  }

  setupConnectionListeners(conn) {
    conn.on('data', (data) => this.handleIncomingData(conn.peer, data));
    
    conn.on('close', () => {
      console.log(`Connection closed with peer ${conn.peer}`);
      this.handleConnectionClosed(conn.peer);
    });
    
    conn.on('error', (err) => {
      console.error(`Connection error with peer ${conn.peer}:`, err);
      this.handleConnectionError(conn.peer, err);
    });
  }

  handleConnectionClosed(peerId) {
    const peerInfo = this.connections.get(peerId);
    if (peerInfo) {
      peerInfo.status = 'disconnected';
      this.attemptReconnection(peerId);
    }
  }

  handleConnectionError(peerId, error) {
    const peerInfo = this.connections.get(peerId);
    if (peerInfo) {
      peerInfo.status = 'error';
      this.attemptReconnection(peerId);
    }
  }

  attemptReconnection(peerId) {
    const peerInfo = this.connections.get(peerId);
    if (!peerInfo || peerInfo.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`Maximum reconnect attempts reached for peer ${peerId}, removing connection`);
      this.connections.delete(peerId);
      return;
    }
    
    peerInfo.reconnectAttempts++;
    console.log(`Attempting to reconnect to peer ${peerId} (attempt ${peerInfo.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.connections.has(peerId) || this.connections.get(peerId).status === 'active') return;
      
      const newConn = this.peer.connect(peerId, {
        reliable: true,
        serialization: 'json'
      });
      
      newConn.on('open', () => {
        console.log(`Reconnected to peer ${peerId}`);
        peerInfo.connection = newConn;
        peerInfo.status = 'active';
        peerInfo.reconnectAttempts = 0;
        peerInfo.lastActive = Date.now();
        this.setupConnectionListeners(newConn);
        
        // Send any queued messages
        this.sendQueuedMessages(peerId);
      });
    }, this.reconnectDelay * peerInfo.reconnectAttempts);
  }

  handleIncomingData(peerId, data) {
    console.log(`Received data from ${peerId}`, data);
    
    // Update last active timestamp
    const peerInfo = this.connections.get(peerId);
    if (peerInfo) {
      peerInfo.lastActive = Date.now();
    }
    
    // Process based on message type
    if (data.type === 'handshake') {
      this.handleHandshake(data, peerId);
    } else if (data.type === 'network_info') {
      this.handleNetworkInfo(data);
    } else if (data.type === 'ping') {
      this.sendToPeer(peerId, { type: 'pong', timestamp: Date.now() });
    } else if (data.type === 'pong') {
      // Just update the timestamp, already done above
    } else if (data.type === 'editor_update') {
      this.handleEditorUpdate(data, peerId);
    } else {
      // Legacy support for old format
      this.doupdatestack = false;
      renderer.updateEditor(data);
    }
  }

  handleHandshake(data, sourcePeerId) {
    console.log('Handling handshake from', data.peerId);
    
    // Connect to the new peer if we don't already know them
    if (!this.knownPeers.has(data.peerId) && data.peerId !== this.peer.id) {
      this.connectToPeer(data.peerId);
    }
  }

  handleNetworkInfo(data) {
    console.log('Received network info with peer list:', data.peers);
    
    // Connect to all peers we don't know yet
    data.peers.forEach(peerId => {
      if (!this.knownPeers.has(peerId) && peerId !== this.peer.id) {
        this.connectToPeer(peerId);
      }
    });
  }

  handleEditorUpdate(data, sourcePeerId) {
    this.doupdatestack = false;
    
    // Update editor with the received data
    renderer.updateEditor(data.content);
    
    // Relay the update to all other peers to ensure propagation
    // Use a message ID to prevent infinite loops
    if (!data.messageId) {
      data.messageId = this.generateMessageId();
      this.broadcastToAllExcept(data, sourcePeerId);
    } else if (!this.isMessageSeen(data.messageId)) {
      this.markMessageSeen(data.messageId);
      this.broadcastToAllExcept(data, sourcePeerId);
    }
  }

  // Message deduplication
  seenMessages = new Set();
  maxSeenMessages = 1000;
  
  generateMessageId() {
    return `${this.peer.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  isMessageSeen(messageId) {
    return this.seenMessages.has(messageId);
  }
  
  markMessageSeen(messageId) {
    this.seenMessages.add(messageId);
    if (this.seenMessages.size > this.maxSeenMessages) {
      // Remove oldest entries when we reach capacity
      const iterator = this.seenMessages.values();
      for (let i = 0; i < 100; i++) {
        this.seenMessages.delete(iterator.next().value);
      }
    }
  }

  connectToPeer(peerId) {
    if (this.connections.has(peerId) || peerId === this.peer.id) return;
    
    console.log(`Connecting to peer ${peerId}`);
    document.getElementById('peer-connecting').style.display = 'block';
    
    const conn = this.peer.connect(peerId, {
      reliable: true,
      serialization: 'json'
    });
    
    conn.on('open', () => {
      console.log(`Connected to peer ${peerId}`);
      document.getElementById('peer-connecting').style.display = 'none';
      
      // Send handshake to identify ourselves
      conn.send({ type: 'handshake', peerId: this.peer.id });
      
      this.addConnection(conn);
      this.setupConnectionListeners(conn);
      this.sendQueuedMessages(peerId);
      document.getElementById('peer-connected').style.display = 'block';
      setTimeout(() => {
        document.getElementById('peer-connected').style.display = 'none';
      }, 2000);
    });
    
    conn.on('error', (err) => {
      console.error(`Error connecting to peer ${peerId}:`, err);
      document.getElementById('peer-connecting').style.display = 'none';
      
      // Show error notification
      this.showErrorNotification(peerId, err);
    });
  }

  shareNetworkInfo(conn) {
    // Share list of all known peers with the new connection
    const peerList = Array.from(this.knownPeers);
    conn.send({
      type: 'network_info',
      peers: peerList
    });
  }

  sendToPeer(peerId, data) {
    const peerInfo = this.connections.get(peerId);
    
    if (peerInfo && peerInfo.status === 'active' && peerInfo.connection.open) {
      try {
        peerInfo.connection.send(data);
        return true;
      } catch (err) {
        console.error(`Error sending data to peer ${peerId}:`, err);
        this.queueMessageForPeer(peerId, data);
        return false;
      }
    } else {
      this.queueMessageForPeer(peerId, data);
      return false;
    }
  }

  queueMessageForPeer(peerId, data) {
    if (!this.messageQueue.has(peerId)) {
      this.messageQueue.set(peerId, []);
    }
    
    const queue = this.messageQueue.get(peerId);
    if (queue.length < this.maxQueueSize) {
      queue.push(data);
    } else {
      console.warn(`Message queue full for peer ${peerId}, dropping message`);
    }
  }

  sendQueuedMessages(peerId) {
    if (!this.messageQueue.has(peerId)) return;
    
    const queue = this.messageQueue.get(peerId);
    const peerInfo = this.connections.get(peerId);
    
    if (peerInfo && peerInfo.status === 'active' && peerInfo.connection.open) {
      while (queue.length > 0) {
        const message = queue.shift();
        try {
          peerInfo.connection.send(message);
        } catch (err) {
          console.error(`Error sending queued message to peer ${peerId}:`, err);
          // Put message back at the front of the queue
          queue.unshift(message);
          break;
        }
      }
    }
  }

  broadcastToAll(data) {
    const messageId = this.generateMessageId();
    const messageWithId = { ...data, messageId };
    this.markMessageSeen(messageId);
    
    let successCount = 0;
    this.connections.forEach((peerInfo, peerId) => {
      if (this.sendToPeer(peerId, messageWithId)) {
        successCount++;
      }
    });
    
    return successCount;
  }

  broadcastToAllExcept(data, excludePeerId) {
    let successCount = 0;
    this.connections.forEach((peerInfo, peerId) => {
      if (peerId !== excludePeerId && this.sendToPeer(peerId, data)) {
        successCount++;
      }
    });
    
    return successCount;
  }

  checkConnectionsHealth() {
    const now = Date.now();
    const staleThreshold = 2 * this.pingInterval;
    
    this.connections.forEach((peerInfo, peerId) => {
      // Check if connection is stale
      if (now - peerInfo.lastActive > staleThreshold) {
        console.warn(`Connection to peer ${peerId} is stale, checking status`);
        this.pingPeer(peerId);
      }
    });
  }

  pingPeer(peerId) {
    this.sendToPeer(peerId, {
      type: 'ping',
      timestamp: Date.now()
    });
  }

  showConnectionNotification(peerId) {
    callToast('A new participant has joined!');
    
    if (typeof client !== 'undefined') {
      client.setActivity({
        details: 'Working on a collaborated design',
        state: `Connected with ${this.connections.size} peers`,
        largeImageKey: 'logo_round',
        smallImageKey: 'work_multi',
        startTimestamp: Date.now()
      });
    }
  }

  showErrorNotification(peerId, error) {
    const errorMessage = error?.message || 'Unknown error';
    
    if (typeof diag !== 'undefined') {
      diag.showErrorBox(
        `Failed to connect to peer`, 
        `CompassCAD failed to connect to your multi-edit session. Try:
        - asking the host to retry their instance
        - checking your internet connection
        - double-checking the session ID that was given
        
        Error details: ${errorMessage}`
      );
    }
  }

  handlePeerError(error) {
    console.error('Peer connection error:', error);
    
    if (error.type === 'peer-unavailable') {
      // Handle peer not available
    } else if (error.type === 'network' || error.type === 'server-error') {
      // Attempt to reconnect to the signaling server
      setTimeout(() => {
        if (this.peer.disconnected) {
          this.peer.reconnect();
        }
      }, 3000);
    }
  }

  // Public API
  
  join() {
    return this.initialize();
  }

  joinSession(id) {
    document.getElementById('peer-connecting').style.display = 'block';
    this.connectToPeer(id);
  }

  sendCurrentEditorState() {
    const components = JSON.stringify(renderer.logicDisplay.components);
    return this.broadcastToAll({
      type: 'editor_update',
      content: components,
      timestamp: Date.now()
    });
  }

  getStats() {
    return {
      peerId: this.peer ? this.peer.id : null,
      connectionCount: this.connections.size,
      knownPeers: this.knownPeers.size,
      activeConnections: Array.from(this.connections.values()).filter(p => p.status === 'active').length,
      pendingMessages: Array.from(this.messageQueue.values()).reduce((sum, q) => sum + q.length, 0)
    };
  }
}

// Create singleton instance
const network = new P2PNetwork();

// Export existing API functions to maintain compatibility
const join = () => network.join();
const joinSession = (id) => network.joinSession(id);
const sendCurrentEditorState = () => network.sendCurrentEditorState();

// Initialize the network
join();