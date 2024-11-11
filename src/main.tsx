import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SolanaWalletProvider } from "./SolanaWalletProvider";
import { Buffer } from "buffer";

window.Buffer = Buffer;
window.setTimeout = window.setTimeout || global.setTimeout;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <SolanaWalletProvider>
          <App />
      </SolanaWalletProvider>
  </StrictMode>,
)
