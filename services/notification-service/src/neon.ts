import ws from 'ws';
import { setGlobalDispatcher, Agent } from 'undici';

// Provide WebSocket implementation for Neon serverless driver
(global as any).WebSocket = ws;

// Provide fetch implementation for Neon serverless driver
setGlobalDispatcher(new Agent());

