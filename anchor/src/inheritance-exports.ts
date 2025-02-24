// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import InheritanceIDL from '../target/idl/inheritance.json'
import type { Inheritance } from '../target/types/inheritance'

// Re-export the generated IDL and type
export { Inheritance, InheritanceIDL }

// The programId is imported from the program IDL.
export const INHERITANCE_PROGRAM_ID = new PublicKey(InheritanceIDL.address)

// This is a helper function to get the Inheritance Anchor program.
export function getInheritanceProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...InheritanceIDL, address: address ? address.toBase58() : InheritanceIDL.address } as Inheritance, provider)
}

// This is a helper function to get the program ID for the Inheritance program depending on the cluster.
export function getInheritanceProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Inheritance program on devnet and testnet.
      return new PublicKey('CRpkPb9EwbMSvNiyiMD4nqAdGJZGwdcS69vBZq77VZUn')
    case 'mainnet-beta':
    default:
      return INHERITANCE_PROGRAM_ID
  }
}
