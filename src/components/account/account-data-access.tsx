'use client'

import {TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID} from '@solana/spl-token'
import {useConnection, useWallet} from '@solana/wallet-adapter-react'
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {useTransactionToast} from '../ui/ui-layout';

export function useGetBalance({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getBalance(address),
  })
}

export function useGetSignatures({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getSignaturesForAddress(address),
  })
}

// export async function getTokenMetadata(connection: Connection, mint: PublicKey) {
//   try {
//     const metadataPDA = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from('metadata'),
//         new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
//         mint.toBuffer(),
//       ],
//       new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
//     )[0];

//     const metadataAccount = await connection.getAccountInfo(metadataPDA);
//     console.log(metadataAccount)
//     if (!metadataAccount) return null;


//     // Use the latest Metadata deserialization method
//     //@ts-ignore
//     const metadata = Metadata.fromAccountInfo(metadataAccount)[0];
    
//     return {
//       name: metadata.name,
//       symbol: metadata.symbol,
//       uri: metadata.uri
//     };
//   } catch (error) {
//     console.error('Error fetching token metadata:', error);
//     return null;
//   }
// }

// export async function getTokenMetadata(connection: Connection, mint: PublicKey) {
//   try {
//     // Token metadata program ID
//     const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
    
//     // Derive metadata account
//     const [metadataAccount] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from('metadata'),
//         TOKEN_METADATA_PROGRAM_ID.toBuffer(),
//         mint.toBuffer(),
//       ],
//       TOKEN_METADATA_PROGRAM_ID
//     );

//     // Fetch metadata account
//     const account = await connection.getAccountInfo(metadataAccount);
    
//     if (!account) {
//       // For tokens without metadata, return a default format
//       return {
//         name: `Token (${mint.toString().slice(0, 4)}...)`,
//         symbol: 'UNKNOWN',
//         uri: ''
//       };
//     }

//     // Deserialize the metadata account
//     //@ts-ignore
//     const [metadata] = Metadata.fromAccountInfo(account);
    
//     // Clean up the name and symbol by removing null characters
//     const name = metadata.data.name.replace(/\0/g, '');
//     const symbol = metadata.data.symbol.replace(/\0/g, '');
    
//     return {
//       name: name,
//       symbol: symbol,
//       uri: metadata.data.uri.replace(/\0/g, '')
//     };

//   } catch (error) {
//     console.error('Error fetching token metadata:', error);
//     // Return a default format for errors
//     return {
//       name: `Token (${mint.toString().slice(0, 4)}...)`,
//       symbol: 'UNKNOWN',
//       uri: ''
//     };
//   }
// }


export function useGetTokenAccounts({ address }: { address: PublicKey }) {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address }],
    queryFn: async () => {
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_PROGRAM_ID,
        }),
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      ])
      return [...tokenAccounts.value, ...token2022Accounts.value]
      // const allAccounts = [...tokenAccounts.value, ...token2022Accounts.value];

      // // Fetch metadata for all token accounts
      // const enrichedAccounts = await Promise.all(
      //   allAccounts.map(async (account) => {
      //     const mintAddress = new PublicKey(account.account.data.parsed.info.mint);
      //     const metadata = await getTokenMetadata(connection, mintAddress);

      //     console.log(metadata)

      //     return {
      //       ...account,
      //       metadata: metadata ? {
      //         name: metadata.name,
      //         symbol: metadata.symbol,
      //         uri: metadata.uri
      //       } : {
      //         name: `Unknown Token (${mintAddress.toString().slice(0, 4)}...)`,
      //         symbol: 'UNKNOWN',
      //         uri: ''
      //       }
      //     };
      //   })
      // );

      // return enrichedAccounts;
    },
  })
}

export function useTransferSol({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['transfer-sol', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (input: { destination: PublicKey; amount: number }) => {
      let signature: TransactionSignature = ''
      try {
        const { transaction, latestBlockhash } = await createTransaction({
          publicKey: address,
          destination: input.destination,
          amount: input.amount,
          connection,
        })

        // Send transaction and await for signature
        signature = await wallet.sendTransaction(transaction, connection)

        // Send transaction and await for signature
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

        console.log(signature)
        return signature
      } catch (error: unknown) {
        console.log('error', `Transaction failed! ${error}`, signature)

        return
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature)
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
      ])
    },
    onError: (error: unknown) => {
      toast.error(`Transaction failed! ${error}`)
    },
  })
}

export function useRequestAirdrop({ address }: { address: PublicKey }) {
  const { connection } = useConnection()
  const transactionToast = useTransactionToast()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['airdrop', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (amount: number = 1) => {
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL),
      ])

      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
      ])
    },
  })
}

async function createTransaction({
  publicKey,
  destination,
  amount,
  connection,
}: {
  publicKey: PublicKey
  destination: PublicKey
  amount: number
  connection: Connection
}): Promise<{
  transaction: VersionedTransaction
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number }
}> {
  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash()

  // Create instructions to send, in this case a simple transfer
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: destination,
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  ]

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage()

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy)

  return {
    transaction,
    latestBlockhash,
  }
}
