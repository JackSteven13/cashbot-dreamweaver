
/**
 * Tableau de noms de cryptomonnaies pour générer des rapports aléatoires
 */
const cryptoNames = [
  "Bitcoin",
  "Ethereum",
  "Cardano",
  "Binance Coin",
  "Solana",
  "Polygon",
  "Polkadot",
  "Avalanche",
  "Chainlink",
  "Stellar",
  "Algorand",
  "Tezos",
  "VeChain",
  "Cosmos",
  "Near Protocol",
  "Fantom",
  "Harmony",
  "Decentraland",
  "The Sandbox",
  "Axie Infinity"
];

/**
 * Renvoie un nom de cryptomonnaie aléatoire
 */
export const getRandomCryptoName = (): string => {
  const randomIndex = Math.floor(Math.random() * cryptoNames.length);
  return cryptoNames[randomIndex];
};
