// src/WalletProvider.js
import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

export const SolanaWalletProvider = ({ children }) => {
    // const rpc = 'https://radial-withered-valley.solana-mainnet.quiknode.pro/4e1224dadb75d27d40d1ed9ddf7ef8587520db39'
    const rpc = 'https://mainnet.helius-rpc.com/?api-key=cc7b02f3-dd27-44f6-a11b-4bf6f9a47ff3'
    const network = clusterApiUrl("mainnet-beta");
    const endpoint = network;

    const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

    return (
        <ConnectionProvider endpoint={rpc}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
