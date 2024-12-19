import sdk from "@farcaster/frame-sdk";
import { SwitchChainError, fromHex, getAddress, numberToHex } from "viem";
import { ChainNotConfiguredError, createConnector } from "wagmi";

frameConnector.type = "frameConnector" as const;

export function frameConnector() {
  let connected = false;
  let initialized = false;

  const initialize = async () => {
    if (!initialized) {
      try {
        // Check if we have frame parameters in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const fid = urlParams.get('fid');
        
        if (!fid) {
          console.log('No frame parameters found, might be first load');
          return;
        }

        // Initialize the SDK with frame data
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
      await initialize();
      await this.connect({ chainId: config.chains[0].id });
    },

    async connect({ chainId } = {}) {
      await initialize();
      
      try {
        const provider = await this.getProvider();
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });

        let currentChainId = await this.getChainId();
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain!({ chainId });
          currentChainId = chain.id;
        }

        connected = true;

        return {
          accounts: accounts.map((x) => getAddress(x)),
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
    },

    async getAccounts() {
      if (!connected || !initialized) {
        return [];
      }

      try {
        const provider = await this.getProvider();
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });
        return accounts.map((x) => getAddress(x));
      } catch (error) {
        console.error("Failed to get accounts:", error);
        return [];
      }
    },

    async getChainId() {
      if (!initialized) {
        return config.chains[0].id;
      }

      try {
        const provider = await this.getProvider();
        const hexChainId = await provider.request({ method: "eth_chainId" });
        return fromHex(hexChainId, "number");
      } catch (error) {
        console.error("Failed to get chain ID:", error);
        return config.chains[0].id;
      }
    },

    async isAuthorized() {
      if (!connected || !initialized) {
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
      if (!initialized) {
        throw new Error("SDK not initialized");
      }

      const provider = await this.getProvider();
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

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        this.onDisconnect();
      } else {
        config.emitter.emit("change", {
          accounts: accounts.map((x) => getAddress(x)),
        });
      }
    },

    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },

    async onDisconnect() {
      connected = false;
      config.emitter.emit("disconnect");
    },

    async getProvider() {
      if (!initialized) {
        await initialize();
      }
      return sdk.wallet.ethProvider;
    },
  }));
}
