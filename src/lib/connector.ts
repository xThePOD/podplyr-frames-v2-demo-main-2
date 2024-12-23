import sdk from "@farcaster/frame-sdk";
import { SwitchChainError, fromHex, getAddress, numberToHex } from "viem";
import { ChainNotConfiguredError, createConnector } from "wagmi";

frameConnector.type = "frameConnector" as const;

export function frameConnector() {
  let connected = false;
  let initialized = false;
  let provider: any = null;

  const initialize = async () => {
    if (!initialized) {
      try {
        // Check if we have frame parameters in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const fid = urlParams.get('fid');
        
        if (!fid) {
          console.log('No frame parameters found, might be first load');
          // Don't throw here, just return and let the app handle the uninitialized state
          return;
        }

        // Initialize the provider
        provider = sdk.wallet.ethProvider;
        
        if (!provider) {
          throw new Error("Failed to initialize provider");
        }

        initialized = true;
      } catch (error) {
        console.error("Failed to initialize Frame SDK:", error);
        throw error;
      }
    }
  };

  return createConnector<typeof sdk.wallet.ethProvider>((config) => ({
    id: "farcaster",
    name: "Farcaster Wallet",
    type: frameConnector.type,

    async setup() {
      try {
        await initialize();
        if (initialized) {
          await this.connect({ chainId: config.chains[0].id });
        }
      } catch (error) {
        console.error("Setup failed:", error);
        // Don't throw here, let the app handle the uninitialized state
      }
    },

    async connect({ chainId } = {}) {
      try {
        await initialize();
        
        if (!initialized || !provider) {
          throw new Error("Provider not initialized");
        }

        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts returned");
        }

        let currentChainId = await this.getChainId();
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain!({ chainId });
          currentChainId = chain.id;
        }

        connected = true;

        return {
          accounts: accounts.map((x: string) => getAddress(x)),
          chainId: currentChainId,
        };
      } catch (error) {
        console.error("Failed to connect:", error);
        connected = false;
        throw error;
      }
    },

    async disconnect() {
      connected = false;
      provider = null;
      initialized = false;
    },

    async getAccounts() {
      if (!connected || !initialized || !provider) {
        return [];
      }

      try {
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });
        return accounts.map((x: string) => getAddress(x));
      } catch (error) {
        console.error("Failed to get accounts:", error);
        return [];
      }
    },

    async getChainId() {
      if (!initialized || !provider) {
        return config.chains[0].id;
      }

      try {
        const hexChainId = await provider.request({ method: "eth_chainId" });
        return fromHex(hexChainId, "number");
      } catch (error) {
        console.error("Failed to get chain ID:", error);
        return config.chains[0].id;
      }
    },

    async isAuthorized() {
      if (!connected || !initialized || !provider) {
        return false;
      }

      try {
        const accounts = await this.getAccounts();
        return !!accounts.length;
      } catch {
        return false;
      }
    },

    async switchChain({ chainId }) {
      if (!initialized || !provider) {
        throw new Error("Provider not initialized");
      }

      const chain = config.chains.find((x) => x.id === chainId);
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: numberToHex(chainId) }],
        });

        config.emitter.emit("change", { chainId });
        return chain;
      } catch (error) {
        console.error("Failed to switch chain:", error);
        throw error;
      }
    },

    onAccountsChanged(accounts: string[]) {
      if (accounts.length === 0) {
        this.onDisconnect();
      } else {
        config.emitter.emit("change", {
          accounts: accounts.map((x: string) => getAddress(x)),
        });
      }
    },

    onChainChanged(chain: string) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },

    async onDisconnect() {
      connected = false;
      provider = null;
      initialized = false;
      config.emitter.emit("disconnect");
    },

    async getProvider() {
      if (!initialized) {
        await initialize();
      }
      return provider || sdk.wallet.ethProvider;
    },
  }));
}
