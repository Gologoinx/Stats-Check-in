import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { ReactNode } from "react";

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [base],
    transports: {
      // RPC URL for each chain
      [base.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: "c362140417242d547f87093256086884", // Public demo key

    // Required App Info
    appName: "Base Stats & Check-in",

    // Optional App Info
    appDescription: "Track your Base wallet statistics and perform daily check-ins.",
    appUrl: "https://base.org", // your app's url
    appIcon: "https://base.org/favicon.ico", // your app's icon
  }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
