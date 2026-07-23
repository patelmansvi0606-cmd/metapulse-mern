import { io } from "socket.io-client";

let socket = null;

/** One shared connection for the whole app — created lazily on first use, after login. */
export function getSocket() {
  if (!socket) {
    socket = io("/", { withCredentials: true, autoConnect: false });
  }
  return socket;
}

export function joinWorkspaceRoom(workspaceId) {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (!s.connected) s.connect();
    s.emit("workspace:join", workspaceId, (ack) => {
      if (ack?.ok) resolve();
      else reject(new Error(ack?.error ?? "Failed to join workspace room"));
    });
  });
}

export function leaveWorkspaceRoom(workspaceId) {
  getSocket().emit("workspace:leave", workspaceId);
}

export function disconnectSocket() {
  socket?.disconnect();
}
