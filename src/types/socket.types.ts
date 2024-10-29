// src/types/socket.types.ts
import { Server as SocketServer } from "socket.io";

export interface ServerToClientEvents {
  notification: (notification: any) => void;
  // Add other event types that server emits to client
}

export interface ClientToServerEvents {
  join: (compteId: string) => void;
  disconnect: () => void;
  // Add other event types that client emits to server
}

export interface InterServerEvents {
  // Define inter-server events if any
}

export interface SocketData {
  // Define any custom socket data
}

export type TypedSocketServer = SocketServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
