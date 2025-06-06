// Import the JSON artifacts
import multiRaffleArtifact from "./abis/MultiRaffle.json";
import raffleFactoryArtifact from "./abis/RaffleFactory.json";

// Export the ABI from each artifact’s "abi" field
export const RAFFLE_CONTRACT_ABI = multiRaffleArtifact.abi;
export const RAFFLE_FACTORY_ABI = raffleFactoryArtifact.abi;

// Export the deployed contract addresses – make sure these are correct!
export const RAFFLE_CONTRACT_ADDRESS = "0xe4eBC01Ceee366fd2A7398f8fE3571EE8b690BF4";
export const RAFFLE_FACTORY_ADDRESS = "0xB18125bcfBf2021D347777af430bb928AC28f91f";
