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
  AaveV3Scroll,
  AaveV3Linea,
  AaveV3Sonic,
  AaveV3ZkSync,
  AaveV3EthereumEtherFi,
  AaveV3Celo,
} from "@bgd-labs/aave-address-book";

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
    name: "Ethereum",
    chainId: AaveV3Ethereum.CHAIN_ID,
    contractAddress: AaveV3Ethereum.POOL, // Aave V3 Pool on Ethereum from address book
    defaultRpcUrl: "https://eth.llamarpc.com",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://etherscan.io",
  },
  polygon: {
    name: "Polygon",
    chainId: AaveV3Polygon.CHAIN_ID,
    contractAddress: AaveV3Polygon.POOL, // Aave V3 Pool on Polygon from address book
    defaultRpcUrl: "https://polygon-rpc.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    blockExplorerUrl: "https://polygonscan.com",
  },
  avalanche: {
    name: "Avalanche",
    chainId: AaveV3Avalanche.CHAIN_ID,
    contractAddress: AaveV3Avalanche.POOL, // Aave V3 Pool on Avalanche from address book
    defaultRpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
    blockExplorerUrl: "https://snowtrace.io",
  },
  optimism: {
    name: "Optimism",
    chainId: AaveV3Optimism.CHAIN_ID,
    contractAddress: AaveV3Optimism.POOL, // Aave V3 Pool on Optimism from address book
    defaultRpcUrl: "https://mainnet.optimism.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://optimistic.etherscan.io",
  },
  arbitrum: {
    name: "Arbitrum",
    chainId: AaveV3Arbitrum.CHAIN_ID,
    contractAddress: AaveV3Arbitrum.POOL, // Aave V3 Pool on Arbitrum from address book
    defaultRpcUrl: "https://arb1.arbitrum.io/rpc",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://arbiscan.io",
  },
  gnosis: {
    name: "Gnosis",
    chainId: AaveV3Gnosis.CHAIN_ID,
    contractAddress: AaveV3Gnosis.POOL, // Aave V3 Pool on Gnosis from address book
    defaultRpcUrl: "https://rpc.gnosischain.com",
    nativeCurrency: {
      name: "xDai",
      symbol: "xDAI",
      decimals: 18,
    },
    blockExplorerUrl: "https://gnosisscan.io",
  },
  base: {
    name: "Base",
    chainId: AaveV3Base.CHAIN_ID,
    contractAddress: AaveV3Base.POOL, // Aave V3 Pool on Base from address book
    defaultRpcUrl: "https://mainnet.base.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://basescan.org",
  },
  metis: {
    name: "Metis",
    chainId: AaveV3Metis.CHAIN_ID,
    contractAddress: AaveV3Metis.POOL, // Aave V3 Pool on Metis from address book
    defaultRpcUrl: "https://andromeda.metis.io/?owner=1088",
    nativeCurrency: {
      name: "Metis",
      symbol: "METIS",
      decimals: 18,
    },
    blockExplorerUrl: "https://andromeda-explorer.metis.io",
  },
  "bnb chain": {
    name: "BNB Chain",
    chainId: AaveV3BNB.CHAIN_ID,
    contractAddress: AaveV3BNB.POOL, // Aave V3 Pool on BNB Chain from address book
    defaultRpcUrl: "https://bsc-dataseed.binance.org",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    blockExplorerUrl: "https://bscscan.com",
  },
  scroll: {
    name: "Scroll",
    chainId: AaveV3Scroll.CHAIN_ID,
    contractAddress: AaveV3Scroll.POOL, // Aave V3 Pool on Scroll from address book
    defaultRpcUrl: "https://rpc.scroll.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://scrollscan.com",
  },
  linea: {
    name: "Linea",
    chainId: AaveV3Linea.CHAIN_ID,
    contractAddress: AaveV3Linea.POOL, // Aave V3 Pool on Linea from address book
    defaultRpcUrl: "https://rpc.linea.build",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://lineascan.build",
  },
  sonic: {
    name: "Sonic",
    chainId: AaveV3Sonic.CHAIN_ID,
    contractAddress: AaveV3Sonic.POOL, // Aave V3 Pool on Sonic from address book
    defaultRpcUrl: "https://sonic-rpc.publicnode.com",
    nativeCurrency: {
      name: "Fantom",
      symbol: "FTM",
      decimals: 18,
    },
    blockExplorerUrl: "https://explorer.sonic.fantom.network",
  },
  zksync: {
    name: "zkSync Era",
    chainId: AaveV3ZkSync.CHAIN_ID,
    contractAddress: AaveV3ZkSync.POOL, // Aave V3 Pool on zkSync from address book
    defaultRpcUrl: "https://mainnet.era.zksync.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://explorer.zksync.io",
  },
  etherfi: {
    name: "EtherFi",
    chainId: AaveV3EthereumEtherFi.CHAIN_ID,
    contractAddress: AaveV3EthereumEtherFi.POOL, // Aave V3 Pool for EtherFi from address book
    defaultRpcUrl: "https://eth.public-rpc.com",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrl: "https://etherscan.io",
  },
  celo: {
    name: "Celo",
    chainId: AaveV3Celo.CHAIN_ID,
    contractAddress: AaveV3Celo.POOL, // Aave V3 Pool on Celo from address book
    defaultRpcUrl: "https://celo-rpc.publicnode.com",
    nativeCurrency: {
      name: "Celo",
      symbol: "CELO",
      decimals: 18,
    },
    blockExplorerUrl: "https://celoscan.io/",
  },
};

// Add Polygon zkEVM if available in the package
try {
  const { AaveV3PolygonZkEvm } = require("@bgd-labs/aave-address-book");
  if (AaveV3PolygonZkEvm?.POOL) {
    networks.zkevm = {
      name: "Polygon zkEVM",
      chainId: AaveV3PolygonZkEvm.CHAIN_ID,
      contractAddress: AaveV3PolygonZkEvm.POOL,
      defaultRpcUrl: "https://zkevm-rpc.com",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      blockExplorerUrl: "https://zkevm.polygonscan.com",
    };
  }
} catch (e) {
  console.log(
    "Polygon zkEVM not available in this version of aave-address-book"
  );
}

export default networks;

// Get network by chain ID
export const getNetworkByChainId = (
  chainId: number
): NetworkConfig | undefined => {
  return Object.values(networks).find((network) => network.chainId === chainId);
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
  return Object.values(networks).map((network) => network.chainId);
};
