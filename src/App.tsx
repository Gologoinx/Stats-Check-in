import { useState, useEffect } from "react";
import { useAccount, useBalance, useTransactionCount, useSendTransaction, useWaitForTransactionReceipt, useWriteContract, useSwitchChain } from "wagmi";
import { ConnectKitButton, useModal } from "connectkit";
import { formatEther, parseEther } from "viem";
import { base } from "wagmi/chains";
import { 
  Wallet, 
  Activity, 
  Calendar, 
  Flame, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Clock,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "motion/react";

// Builder Code for Base Ecosystem
const BUILDER_CODE = "0xbb85000012345678"; 

// ABI for the BaseDailyCheckIn contract
const CHECKIN_ABI = [
  {
    "inputs": [],
    "name": "checkIn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export default function App() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({ address });
  const { data: txCount, isLoading: isTxCountLoading } = useTransactionCount({ address });
  const { setOpen } = useModal();
  const { switchChain } = useSwitchChain();
  
  const [checkInStatus, setCheckInStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { sendTransaction, data: sendHash, error: sendError } = useSendTransaction();
  const { writeContract, data: writeHash, error: writeError } = useWriteContract();
  
  const hash = writeHash || sendHash;
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Contract Address (User will replace this after deploying in Remix)
  const CHECKIN_CONTRACT_ADDRESS = "0xd07e0a99DBe142A60eCbFbcd13A935bb7bBBE167"; 

  useEffect(() => {
    if (isConfirmed) {
      setCheckInStatus("success");
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (sendError || writeError) {
      setCheckInStatus("error");
      const error = sendError || writeError;
      if (error?.message?.toLowerCase().includes("insufficient funds")) {
        setErrorMessage("Insufficient funds for gas. Please ensure you are on Base network and have enough ETH.");
      } else {
        setErrorMessage(error?.message || "Transaction failed");
      }
    }
  }, [sendError, writeError]);

  const handleCheckIn = async () => {
    if (!isConnected) {
      setOpen(true);
      return;
    }

    // Ensure we are on Base
    if (chain?.id !== base.id) {
      try {
        switchChain({ chainId: base.id });
        return;
      } catch (err) {
        setCheckInStatus("error");
        setErrorMessage("Please switch to Base network in your wallet.");
        return;
      }
    }
    
    try {
      setCheckInStatus("pending");
      setErrorMessage("");
      
      if (CHECKIN_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000") {
        // Call the smart contract function
        writeContract({
          address: CHECKIN_CONTRACT_ADDRESS as `0x${string}`,
          abi: CHECKIN_ABI,
          functionName: "checkIn",
          account: address,
          chain: chain,
        });
      } else {
        // Fallback: Send 0 ETH to self with Builder Code
        sendTransaction({
          to: address as `0x${string}`,
          value: parseEther("0"),
          data: BUILDER_CODE as `0x${string}`,
        });
      }
    } catch (err: any) {
      setCheckInStatus("error");
      setErrorMessage(err.message || "Transaction failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#141414] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <h1 className="font-bold text-lg tracking-tight">Base Stats</h1>
          </div>
          <ConnectKitButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Stats Card */}
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Wallet Stats</CardTitle>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected ? (
                <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Wallet not connected</p>
                    <p className="text-xs text-gray-400 mt-1">Connect your wallet to see your Base stats</p>
                  </div>
                  <ConnectKitButton />
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Total Balance</p>
                    {isBalanceLoading ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{balance ? parseFloat(formatEther(balance.value)).toFixed(4) : "0.0000"}</span>
                        <span className="text-sm font-medium text-gray-500">ETH</span>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-gray-100" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>Transactions</span>
                      </div>
                      {isTxCountLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        <p className="text-xl font-semibold">{txCount ?? 0}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Flame className="w-3 h-3" />
                        <span>Gas Spent</span>
                      </div>
                      <a 
                        href={`https://basescan.org/address/${address}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium"
                      >
                        View on BaseScan <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>First Tx</span>
                      </div>
                      <a 
                        href={`https://basescan.org/address/${address}#transactions`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 flex items-center gap-1 text-xs font-medium"
                      >
                        Check History <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>Last Tx</span>
                      </div>
                      <p className="text-xs font-medium text-gray-600">See BaseScan</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50/50 border-t border-gray-100 py-3">
              <p className="text-[10px] text-gray-400 italic">
                * Some stats require indexing and are best viewed on BaseScan.
              </p>
            </CardFooter>
          </Card>

          {/* Check-in Card */}
          <Card className="border-none shadow-sm bg-white flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Daily Check-in</CardTitle>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none">Free + Gas</Badge>
              </div>
              <CardDescription>
                Perform a daily on-chain check-in to boost your activity on Base.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center py-10">
              <AnimatePresence mode="wait">
                {checkInStatus === "success" ? (
                  <motion.div 
                    key="success"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-bold text-lg">Check-in Complete!</h3>
                    <p className="text-sm text-gray-500 mt-1">Your transaction was successful.</p>
                    {hash && (
                      <a 
                        href={`https://basescan.org/tx/${hash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View Transaction <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <Button 
                      variant="outline" 
                      className="mt-6"
                      onClick={() => setCheckInStatus("idle")}
                    >
                      Done
                    </Button>
                  </motion.div>
                ) : checkInStatus === "pending" || isConfirming ? (
                  <motion.div 
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                    <h3 className="font-bold text-lg">Processing...</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {isConfirming ? "Waiting for confirmation..." : "Please confirm in your wallet"}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                    <Button 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-full shadow-lg shadow-blue-200"
                      onClick={handleCheckIn}
                    >
                      {isConnected ? "Check-in Now" : "Connect to Check-in"}
                    </Button>
                    <p className="text-xs text-gray-400 mt-4 max-w-[200px]">
                      {isConnected 
                        ? "This sends a 0 ETH transaction to yourself with a Builder Code."
                        : "Connect your wallet first to perform a check-in."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {checkInStatus === "error" && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t border-gray-100 bg-gray-50/50 flex flex-col items-start gap-2 py-4">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <span>Builder Code Enabled</span>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                This transaction includes a Base Builder Code ({BUILDER_CODE.slice(0, 10)}...) to support the ecosystem.
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              What are Builder Codes?
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Builder codes are unique identifiers added to transactions. They help Base track which applications are driving activity on the network.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Why Check-in?
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Regular on-chain activity is a key metric for wallet health in the Base ecosystem. It shows you are an active participant.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Gas Fees
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Base is designed to be ultra-low cost. A check-in transaction typically costs less than $0.01 in gas.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 py-10 bg-white">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">B</span>
            </div>
            <span className="font-bold text-sm">Base Stats</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="https://docs.base.org/base-chain/builder-codes/builder-codes" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Builder Codes</a>
            <a href="https://docs.base.org/get-started/build-app" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Base Docs</a>
            <a href="https://basescan.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">BaseScan</a>
          </div>
          <p className="text-[10px] text-gray-400">
            Built for the Base Ecosystem. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
