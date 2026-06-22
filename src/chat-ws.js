/**
 * Singleton STOMP WebSocket service for live chat.
 * Uses @stomp/stompjs over native WebSocket.
 * Backend endpoint: ws://localhost:8080/ws  (STOMP, no SockJS)
 */
import { Client } from '@stomp/stompjs';

const WS_URL = 'ws://localhost:8080/ws';

let _client = null;
let _connected = false;
const _pendingSubs = [];   // { destination, callback } queued before connection
const _activeSubs = {};    // destination -> StompSubscription

function getToken() {
  return localStorage.getItem('luz_token') || '';
}

export function connectWS(onConnected) {
  if (_client && _connected) {
    onConnected && onConnected();
    return;
  }

  _client = new Client({
    brokerURL: WS_URL,
    connectHeaders: { Authorization: `Bearer ${getToken()}` },
    reconnectDelay: 5000,
    onConnect() {
      _connected = true;
      // Flush queued subscriptions
      _pendingSubs.forEach(({ destination, callback }) => {
        _activeSubs[destination] = _client.subscribe(destination, (frame) => {
          try { callback(JSON.parse(frame.body)); } catch (_) { callback(frame.body); }
        });
      });
      _pendingSubs.length = 0;
      onConnected && onConnected();
    },
    onDisconnect() {
      _connected = false;
    },
    onStompError(frame) {
      console.warn('[WS] STOMP error', frame.headers?.message);
    }
  });

  _client.activate();
}

export function subscribeWS(destination, callback) {
  if (_connected && _client) {
    if (_activeSubs[destination]) {
      _activeSubs[destination].unsubscribe();
    }
    _activeSubs[destination] = _client.subscribe(destination, (frame) => {
      try { callback(JSON.parse(frame.body)); } catch (_) { callback(frame.body); }
    });
  } else {
    // Remove duplicate destination in queue
    const idx = _pendingSubs.findIndex(s => s.destination === destination);
    if (idx >= 0) _pendingSubs.splice(idx, 1);
    _pendingSubs.push({ destination, callback });
  }
}

export function unsubscribeWS(destination) {
  if (_activeSubs[destination]) {
    try { _activeSubs[destination].unsubscribe(); } catch (_) {}
    delete _activeSubs[destination];
  }
}

export function publishWS(destination, body) {
  if (_connected && _client) {
    _client.publish({ destination, body: JSON.stringify(body) });
  }
}

export function disconnectWS() {
  if (_client) {
    _client.deactivate();
    _client = null;
    _connected = false;
    Object.keys(_activeSubs).forEach(k => delete _activeSubs[k]);
  }
}
