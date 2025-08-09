import { createContext } from 'react';

export const SocketContext = createContext(null);
export const UserContext   = createContext({
  role: null,
  setRole: () => {}
});