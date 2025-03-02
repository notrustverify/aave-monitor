import { 
  AaveV3Ethereum, 
  AaveV3Polygon, 
  AaveV3Avalanche, 
  AaveV3Optimism, 
  AaveV3Arbitrum, 
  AaveV3Gnosis, 
  AaveV3Base,
  AaveV3Metis,
  AaveV3BNB,
  AaveV3Scroll
} from '@bgd-labs/aave-address-book';

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

// Define chain IDs for all networks
const ChainId = {
  mainnet: 1,
  polygon: 137,
  avalanche: 43114,
  optimism: 10,
  arbitrum_one: 42161,
  gnosis: 100,
  base: 8453,
  metis_andromeda: 1088,
  bnb: 56,
  scroll: 534352,
  polygon_zkevm: 1101
};

const networks: Record<string, NetworkConfig> = {
  ethereum: {
    name: 'Ethereum',
    chainId: ChainId.mainnet,
    contractAddress: AaveV3Ethereum.POOL, // Aave V3 Pool on Ethereum from address book
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
    chainId: ChainId.polygon,
    contractAddress: AaveV3Polygon.POOL, // Aave V3 Pool on Polygon from address book
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
    chainId: ChainId.avalanche,
    contractAddress: AaveV3Avalanche.POOL, // Aave V3 Pool on Avalanche from address book
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
    chainId: ChainId.optimism,
    contractAddress: AaveV3Optimism.POOL, // Aave V3 Pool on Optimism from address book
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
    chainId: ChainId.arbitrum_one,
    contractAddress: AaveV3Arbitrum.POOL, // Aave V3 Pool on Arbitrum from address book
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
    chainId: ChainId.gnosis,
    contractAddress: AaveV3Gnosis.POOL, // Aave V3 Pool on Gnosis from address book
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
    chainId: ChainId.base,
    contractAddress: AaveV3Base.POOL, // Aave V3 Pool on Base from address book
    defaultRpcUrl: 'https://mainnet.base.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrl: 'https://basescan.org'
  },
  metis: {
    name: 'Metis',
    chainId: ChainId.metis_andromeda,
    contractAddress: AaveV3Metis.POOL, // Aave V3 Pool on Metis from address book
    defaultRpcUrl: 'https://andromeda.metis.io/?owner=1088',
    nativeCurrency: {
      name: 'Metis',
      symbol: 'METIS',
      decimals: 18
    },
    blockExplorerUrl: 'https://andromeda-explorer.metis.io'
  },
  bnb: {
    name: 'BNB Chain',
    chainId: ChainId.bnb,
    contractAddress: AaveV3BNB.POOL, // Aave V3 Pool on BNB Chain from address book
    defaultRpcUrl: 'https://bsc-dataseed.binance.org',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    blockExplorerUrl: 'https://bscscan.com'
  },
  scroll: {
    name: 'Scroll',
    chainId: ChainId.scroll,
    contractAddress: AaveV3Scroll.POOL, // Aave V3 Pool on Scroll from address book
    defaultRpcUrl: 'https://rpc.scroll.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorerUrl: 'https://scrollscan.com'
  }
};

// Add Polygon zkEVM if available in the package
try {
  const { AaveV3PolygonZkEvm } = require('@bgd-labs/aave-address-book');
  if (AaveV3PolygonZkEvm?.POOL) {
    networks.zkevm = {
      name: 'Polygon zkEVM',
      chainId: ChainId.polygon_zkevm,
      contractAddress: AaveV3PolygonZkEvm.POOL,
      defaultRpcUrl: 'https://zkevm-rpc.com',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      },
      blockExplorerUrl: 'https://zkevm.polygonscan.com'
    };
  }
} catch (e) {
  console.log('Polygon zkEVM not available in this version of aave-address-book');
}

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

// Get all supported chain IDs
export const getSupportedChainIds = (): number[] => {
  return Object.values(networks).map(network => network.chainId);
}; 