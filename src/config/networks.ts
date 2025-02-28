export interface NetworkConfig {
  name: string;
  chainId: number;
  contractAddress: string;
  defaultRpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
}

const networks: Record<string, NetworkConfig> = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    contractAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', // Aave V3 Pool on Ethereum
    defaultRpcUrl: 'https://eth.public-rpc.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrl: 'https://etherscan.io'
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Aave V3 Pool on Polygon
    defaultRpcUrl: 'https://polygon-rpc.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    blockExplorerUrl: 'https://polygonscan.com'
  },
  avalanche: {
    name: 'Avalanche',
    chainId: 43114,
    contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Aave V3 Pool on Avalanche
    defaultRpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    blockExplorerUrl: 'https://snowtrace.io'
  },
  optimism: {
    name: 'Optimism',
    chainId: 10,
    contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Aave V3 Pool on Optimism
    defaultRpcUrl: 'https://mainnet.optimism.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrl: 'https://optimistic.etherscan.io'
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', // Aave V3 Pool on Arbitrum
    defaultRpcUrl: 'https://arb1.arbitrum.io/rpc',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrl: 'https://arbiscan.io'
  },
  gnosis: {
    name: 'Gnosis',
    chainId: 100,
    contractAddress: '0xb50201558B00496A145fE76f7424749556E326D8', // Aave V3 Pool on Gnosis
    defaultRpcUrl: 'https://rpc.gnosischain.com',
    nativeCurrency: {
      name: 'xDai',
      symbol: 'xDAI',
      decimals: 18
    },
    blockExplorerUrl: 'https://gnosisscan.io'
  },
  base: {
    name: 'Base',
    chainId: 8453,
    contractAddress: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5', // Aave V3 Pool on Base
    defaultRpcUrl: 'https://mainnet.base.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrl: 'https://basescan.org'
  }
};

export default networks;

// Get network by chain ID
export const getNetworkByChainId = (chainId: number): NetworkConfig | undefined => {
  return Object.values(networks).find(network => network.chainId === chainId);
};

// Get network by name
export const getNetworkByName = (name: string): NetworkConfig | undefined => {
  return networks[name.toLowerCase()];
};

// Get all networks as an array
export const getAllNetworks = (): NetworkConfig[] => {
  return Object.values(networks);
}; 