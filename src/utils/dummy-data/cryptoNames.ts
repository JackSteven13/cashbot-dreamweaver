
/**
 * Returns a random cryptocurrency name for use in transaction reports
 */
export const getRandomCryptoName = (): string => {
  const cryptoNames = [
    "Bitcoin",
    "Ethereum",
    "Cardano",
    "Solana",
    "Polkadot",
    "Ripple",
    "Avalanche",
    "Chainlink",
    "Polygon",
    "Algorand",
    "Tezos",
    "Stellar",
    "VeChain",
    "Cosmos",
    "Filecoin",
    "Helium",
    "The Graph",
    "Decentraland",
    "Axie Infinity",
    "Uniswap"
  ];
  
  const randomIndex = Math.floor(Math.random() * cryptoNames.length);
  return cryptoNames[randomIndex];
};
