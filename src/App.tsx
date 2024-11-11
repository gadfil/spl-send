import React, { useCallback, useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
    TOKEN_PROGRAM_ID,
    createTransferInstruction,
    getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import {
    PublicKey,
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
    TransactionMessage,
} from "@solana/web3.js";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import { Buffer } from "buffer";

const USDT_MINT_ADDRESS = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const RECIPIENT_ADDRESS = "Cr24upCtnEmpLaWzXhopcVPJrkE4daZYnVtUq2y7zAgS";

const App: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [usdtBalance, setUsdtBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBalance = useCallback(async () => {
        if (!publicKey) return;

        try {
            const usdtMint = new PublicKey(USDT_MINT_ADDRESS);
            const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                publicKey,
                usdtMint,
                publicKey
            );

            const accountInfo = await connection.getTokenAccountBalance(senderTokenAccount.address);
            setUsdtBalance(parseFloat(accountInfo.value.amount) / Math.pow(10, 6));
        } catch (error) {
            console.error("Ошибка при получении баланса:", error);
            setUsdtBalance(0);
        }
    }, [connection, publicKey]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    const checkSolBalance = useCallback(async () => {
        if (!publicKey) return false;

        try {
            const balance = await connection.getBalance(publicKey);
            return balance >= 5000; // Минимальный баланс SOL для комиссии
        } catch (error) {
            console.error("Ошибка при проверке SOL баланса:", error);
            return false;
        }
    }, [connection, publicKey]);

    const sendUsdtTransaction = useCallback(async () => {
        if (!publicKey) {
            alert("Сначала подключите кошелек!");
            return;
        }

        if (usdtBalance === null || usdtBalance < 1) {
            alert("Недостаточно средств для отправки!");
            return;
        }

        setIsLoading(true);

        try {
            const hasSol = await checkSolBalance();
            if (!hasSol) {
                alert("Недостаточно SOL для оплаты комиссии!");
                return;
            }

            const recipient = new PublicKey(RECIPIENT_ADDRESS);
            const usdtMint = new PublicKey(USDT_MINT_ADDRESS);

            // Получаем последний блокхеш
            const latestBlockhash = await connection.getLatestBlockhash();

            // Получаем или создаем токен-аккаунты
            const [recipientTokenAccount, senderTokenAccount] = await Promise.all([
                getOrCreateAssociatedTokenAccount(connection, publicKey, usdtMint, recipient),
                getOrCreateAssociatedTokenAccount(connection, publicKey, usdtMint, publicKey)
            ]);

            // Создаем инструкции
            const transferInstruction = createTransferInstruction(
                senderTokenAccount.address,
                recipientTokenAccount.address,
                publicKey,
                1 * Math.pow(10, 6),
                [],
                TOKEN_PROGRAM_ID
            );

            const memoInstruction = new TransactionInstruction({
                keys: [],
                programId: MEMO_PROGRAM_ID,
                data: Buffer.from("Payment for services"),
            });

            // Создаем сообщение транзакции
            const messageV0 = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: latestBlockhash.blockhash,
                instructions: [transferInstruction, memoInstruction],
            }).compileToV0Message();

            // Создаем версионированную транзакцию
            const transaction = new VersionedTransaction(messageV0);

            // Отправляем транзакцию
            const signature = await sendTransaction(transaction, connection, {
                maxRetries: 5,
                skipPreflight: false,
            });

            // Ждем подтверждения
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            });

            if (confirmation.value.err === null) {
                alert(`Транзакция успешно выполнена! Подпись: ${signature}`);
                await fetchBalance();
            } else {
                throw new Error(`Ошибка при подтверждении: ${confirmation.value.err}`);
            }

        } catch (error) {
            console.error("Ошибка при отправке USDT:", error);
            alert(`Ошибка при отправке: ${error.message || 'Неизвестная ошибка'}`);
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, connection, sendTransaction, usdtBalance, fetchBalance, checkSolBalance]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "20px" }}>
            <h1>Отправка USDT на Solana</h1>
            <WalletMultiButton />
            {usdtBalance !== null && (
                <div>
                    <p>Ваш баланс USDT: {usdtBalance.toFixed(6)} USDT</p>
                </div>
            )}
            <button
                onClick={sendUsdtTransaction}
                disabled={!publicKey || usdtBalance === null || isLoading}
                style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.7 : 1
                }}
            >
                {isLoading ? "Отправка..." : "Отправить 1 USDT"}
            </button>
        </div>
    );
};

export default App;
