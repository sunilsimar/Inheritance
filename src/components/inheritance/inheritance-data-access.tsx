'use client'

import { getInheritanceProgram, getInheritanceProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { ErrorProps } from 'next/error'
import { amountToUiAmount, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccount, getAccount, getAssociatedTokenAddress, getMint, TOKEN_2022_PROGRAM_ID, TOKEN_GROUP_MEMBER_SIZE, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { BN } from 'bn.js'

interface createPdaArgs {
  owner: PublicKey,
  beneficiary: PublicKey,
  duration: number,
  amount: number,
  userTokenAta: PublicKey
}

export interface DelegationStatus {
  isDelegated: boolean;
  existingDelegation?: {
    statePda: string;
    amount: number;
    beneficiary: string;
    expiryTime: number;
    timeUntilExpiry: number,
  };
}

export interface DelegationStatusOwner {
  isDelegated: boolean;
  existingDelegation?: {
    statePda: string;
    amount: number;
    beneficiary: string;
    expiryTime: number;
    timeUntilExpiry: number,
    tokenAccount: PublicKey,
    mintAccount: PublicKey
  };
}

interface UpdateDelegationArgs {
  owner: PublicKey;
  amount: number,
  userTokenAta: PublicKey,
}

interface ManualCheckinArgs {
  owner: PublicKey
  userTokenAta: PublicKey
}

interface RevokeDelegationArgs {
  owner: PublicKey,
  userTokenAta: PublicKey,
}

interface ManualCheckinAllArgs {
  owner: PublicKey,
  states: PublicKey[],
}

interface ExecuteTransferArgs {
  owner: PublicKey,
  userTokenAta: PublicKey,
  beneficiary: PublicKey,
  mint: PublicKey
}

export function useInheritanceProgram() {
  const { connection } = useConnection()
  const { publicKey } = useWallet();
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getInheritanceProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getInheritanceProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['inheritance', 'all', { cluster }],
    queryFn: () => program.account.state.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  async function isToken2022Account(connection: Connection, tokenAccount: PublicKey): Promise<boolean> {
    try {
      const accountInfo = await connection.getAccountInfo(tokenAccount);
      if (!accountInfo) return false;
      
      // Check if the account's owner is TOKEN_2022_PROGRAM_ID
      return accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID);
    } catch (error) {
      console.error('Error checking token program type:', error);
      return false;
    }
  }

  const initializeState = useMutation<string, Error, createPdaArgs>({
    mutationKey: [`intializeState`, `create`, {cluster} ],
    mutationFn: async ({owner, beneficiary, amount, duration, userTokenAta}) => {

      console.log('inside state')
      //calculate PDA for state account
      const [statePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("inheritance"), owner.toBuffer(), userTokenAta.toBuffer()],
        program.programId,
      );

       // Check if token account is Token-2022
    const isToken2022 = await isToken2022Account(connection, userTokenAta);
    const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      const tokenAccountInfo = await getAccount(
        connection, 
        userTokenAta,
        'confirmed',
        tokenProgramId // Use the correct program ID
      );
      
      const mint = tokenAccountInfo.mint;
      
      // Get mint info
      const mintInfo = await getMint(
        connection,
        mint,
        'confirmed',
        tokenProgramId
      );
      
      // Convert amount to raw amount (lamports)
      const rawAmount = amount * Math.pow(10, mintInfo.decimals);
      

      return program.methods
      .initialize(beneficiary, new BN(duration) , new BN(rawAmount))
      .accounts({
        //@ts-ignore
        state: statePDA,
        owner: owner,
        userTokenAccount: userTokenAta,
        tokenProgram: tokenProgramId,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error creating entry: ${error.message}`);
    },
  });

  const getTokenBalance = useCallback(async (tokenAccount: PublicKey) => {
    try {
      const balance = await connection.getTokenAccountBalance(tokenAccount);
      return balance.value.uiAmount || 0;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  }, [connection]);

  const getInheritanceState = useQuery({
    queryKey: ['inheritance', 'states', { cluster, owner: publicKey?.toString() }],
    queryFn: async () => {
      if (!publicKey) return [];
  
      try {
        const states = await program.account.state.all();
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Get filtered states with current balances
        const filteredStates = await Promise.all(
          states
            .filter(state => state.account.owner.toString() === publicKey.toString())
            .map(async state => {
              // Get current balance for each state's token account
              const currentBalance = await getTokenBalance(new PublicKey(state.account.tokenAccount));

              // Check if token account is Token-2022
              const isToken2022 = await isToken2022Account(connection, state.account.tokenAccount);
              const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
            
              const tokenAccountInfo = await getAccount(
                connection, 
                state.account.tokenAccount,
                'confirmed',
                tokenProgramId // Use the correct program ID
              );
              
              const mint = tokenAccountInfo.mint;
              
              // Get mint info
              const mintInfo = await getMint(
                connection,
                mint,
                'confirmed',
                tokenProgramId
              );
              
              // Convert lamports to token amount using mint decimals
              const tokenAmount = state.account.delegatedAmount.toNumber() / Math.pow(10, mintInfo.decimals);
              
              return {
                publicKey: state.publicKey.toString(),
                account: {
                  owner: state.account.owner.toString(),
                  beneficiary: state.account.beneficiary.toString(),
                  amount: tokenAmount,
                  duration: state.account.duration.toNumber(),
                  expiryTime: state.account.expiryTime.toNumber(),
                  lastCheckin: state.account.expiryTime.toNumber() - state.account.duration.toNumber(),
                  userTokenAccount: state.account.tokenAccount,
                  timeUntilExpiry: state.account.expiryTime.toNumber() - currentTime,
                  currentBalance, // Add current balance
                }
              };
            })
        );
  
        return filteredStates;
      } catch (error) {
        console.error("Error fetching states:", error);
        return [];
      }
    },
    refetchInterval: 10000,
    enabled: !!publicKey,
    refetchOnWindowFocus: true,
  });

  const checkDelegationStatus = useCallback(
    async (tokenAccount: PublicKey): Promise<DelegationStatus> => {
      try {
        const states = await program.account.state.all();
        const currentTime = Math.floor(Date.now() / 1000);
  
        const existingState = states.find(
          (state) => 
            state.account.owner.toString() === publicKey?.toString() &&
            state.account.tokenAccount.toString() === tokenAccount.toString() &&
            state.account.expiryTime.toNumber() > currentTime // Check if not expired
        );
  
        if (existingState) {
            // Check if token account is Token-2022
          const isToken2022 = await isToken2022Account(connection, existingState.account.tokenAccount);
          const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
          const tokenAccountInfo = await getAccount(
            connection, 
            existingState.account.tokenAccount,
            'confirmed',
            tokenProgramId
          );
          
          const mint = tokenAccountInfo.mint;
          
          // Get mint info
          const mintInfo = await getMint(
            connection,
            mint,
            'confirmed',
            tokenProgramId
          );
          
          // Convert lamports to token amount using mint decimals
          const tokenAmount = existingState.account.delegatedAmount.toNumber() / Math.pow(10, mintInfo.decimals);

          return {
            isDelegated: true,
            existingDelegation: {
              statePda: existingState.publicKey.toString(),
              amount: tokenAmount,
              beneficiary: existingState.account.beneficiary.toString(),
              expiryTime: existingState.account.expiryTime.toNumber(),
              timeUntilExpiry: existingState.account.expiryTime.toNumber() - currentTime,
            },
          };
        }
        
  
        return { isDelegated: false };
      } catch (error) {
        console.error("Error checking delegation status:", error);
        return { isDelegated: false };
      }
    },
    [program, publicKey]
  );

  async function getMintFromTokenAccount(tokenAccount: PublicKey) {
    try {
      // First check if it's a Token-2022 account
      const isToken2022 = await isToken2022Account(connection, tokenAccount);
      const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  
      // Get the token account info
      const tokenAccountInfo = await getAccount(
        connection,
        tokenAccount,
        'confirmed',
        tokenProgramId
      );
  
      // Return the mint address
      return tokenAccountInfo.mint;
    } catch (error) {
      console.error('Error getting mint from token account:', error);
      throw error;
    }
  }

  const checkDelegationStatusByOwner = useCallback(
    async (ownerAddress: PublicKey): Promise<DelegationStatusOwner> => {
      try {
        const states = await program.account.state.all();
        const currentTime = Math.floor(Date.now() / 1000);
  
        const existingState = states.find(
          (state) => 
            state.account.owner.toString() === ownerAddress.toString() &&
            state.account.expiryTime.toNumber() <= currentTime // Check for expired delegations
        );

        console.log(existingState)
  
        if (existingState) {
          const mintAccount = await getMintFromTokenAccount(existingState.account.tokenAccount)
          console.log(mintAccount)
          return {
            isDelegated: true,
            existingDelegation: {
              statePda: existingState.publicKey.toString(),
              amount: existingState.account.delegatedAmount.toNumber(),
              beneficiary: existingState.account.beneficiary.toString(),
              expiryTime: existingState.account.expiryTime.toNumber(),
              timeUntilExpiry: existingState.account.expiryTime.toNumber() - currentTime,
              tokenAccount: existingState.account.tokenAccount,
              mintAccount: mintAccount,
            },
          };
        }
  
        return { isDelegated: false };
      } catch (error) {
        console.error("Error checking delegation status:", error);
        return { isDelegated: false };
      }
    },
    [program]
  );
  

  const updateDelegation = useMutation<string, Error, UpdateDelegationArgs> ({
    mutationKey: ['inheritance', 'update', { cluster }],
    mutationFn: async ({ owner, amount, userTokenAta }) => {
      const [statePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("inheritance"), owner.toBuffer(), userTokenAta.toBuffer()],
        program.programId
      );

    // Check if token account is Token-2022
    const isToken2022 = await isToken2022Account(connection, userTokenAta);
    const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

    const tokenAccountInfo = await getAccount(
      connection, 
      userTokenAta,
      'confirmed',
      tokenProgramId // Use the correct program ID
    );
    
    const mint = tokenAccountInfo.mint;
    
    // Get mint info
    const mintInfo = await getMint(
      connection,
      mint,
      'confirmed',
      tokenProgramId
    );
    
    console.log(mintInfo.decimals)
    // Convert amount to raw amount (lamports)
    const rawAmount = amount * Math.pow(10, mintInfo.decimals);

    console.log(rawAmount)

      return program.methods
        .updateDelegation(new BN(rawAmount))
        .accounts({
          //@ts-ignore
          state: statePDA,
          owner: owner,
          userTokenAccount: userTokenAta,
          tokenProgram: tokenProgramId,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error updating delegation: ${error.message}`);
    },
  });

  const manualCheckin = useMutation<string, Error, ManualCheckinArgs> ({
    mutationKey: ['inheritance', 'update', { cluster }],
    mutationFn: async ({ owner, userTokenAta }) => {
      const [statePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("inheritance"), owner.toBuffer(), userTokenAta.toBuffer()],
        program.programId,
      );
      
      return program.methods
        .manualCheckin()
        .accounts({
          state: statePDA,
          //@ts-ignore
          owner: owner,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error in CheckIn: ${error.message}`);
    },
  })

  // const manualCheckinAll = useMutation<string, Error, ManualCheckinAllArgs> ({
  //   mutationKey: ['inheritance', 'checkin-all', { cluster }],
  //   mutationFn: async ({owner, states}) => {
  //     return program.methods
  //       .manualCheckinAll()
  //       .accounts({
  //         owner: owner,
  //         states: states
  //       })
  //       .rpc();
  //   },
  //   onSuccess: (signatre) => {
  //     transactionToast(signatre);
  //     accounts.refetch();
  //   },
  //   onError: (error) => {
  //     toast.error(`Error in CheckIn All: ${error.message}`);
  //   },
  // });

  const revokeDelegation = useMutation<string, Error, RevokeDelegationArgs> ({
    mutationKey: ['inheritance', 'delete', { cluster }],
    mutationFn: async ({ owner, userTokenAta }) => {
      const [statePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("inheritance"), owner.toBuffer(), userTokenAta.toBuffer()],
        program.programId,
      );

    // Check if token account is Token-2022
    const isToken2022 = await isToken2022Account(connection, userTokenAta);
    const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      return program.methods
        .removeDelegation()
        .accounts({
          //@ts-ignore
          state: statePDA,
          userTokenAccount: userTokenAta,
          owner: owner,
          tokenProgram: tokenProgramId,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature),
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error in revoking delegation: ${error.message}`);
    }
  })

  async function verifyTokenAccount(connection: Connection, tokenAccount: PublicKey) {
    try {
      //@ts-ignore
        const account = await getAccount(connection, tokenAccount, TOKEN_2022_PROGRAM_ID);
        console.log(`Token Account ${tokenAccount.toBase58()} is Token-2022 compatible`);
        return true;
    } catch (error) {
        console.error(`Token Account ${tokenAccount.toBase58()} is NOT Token-2022 compatible:`, error);
        return false;
    }
}

  const executeTransfer = useMutation({
    mutationFn: async ({ owner, beneficiary, userTokenAta, mint }: ExecuteTransferArgs) => {
      if (!program) throw new Error('Program not initialized');
      
      // Derive the state PDA
      const [statePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('inheritance'),
          owner.toBuffer(),
          userTokenAta.toBuffer()
        ],
        program.programId
      );
  
      // Check if token account is Token-2022
      const isToken2022 = await isToken2022Account(connection, userTokenAta);
      const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  
      // Get beneficiary's token account
      // const beneficiaryAta = await getAssociatedTokenAddress(
      //   userTokenAta, // mint address
      //   beneficiary,
      //   false,
      //   TOKEN_2022_PROGRAM_ID
      // );
       
      // console.log('beneficiary ata',beneficiaryAta.toBase58())

      console.log('data:',userTokenAta.toBase58(), beneficiary.toBase58(), tokenProgramId.toBase58() )

      const existingAta = await getAssociatedTokenAddress(
        mint,
        beneficiary,
        false,
        tokenProgramId
      );

      console.log(existingAta.toBase58())
      const accountInfo = await connection.getAccountInfo(existingAta);
      if (accountInfo) {
        console.log('Existing ATA found:', existingAta.toBase58());
      } else {
        console.log('No existing ATA found, creating new one if needed.');
      }


    const isUserToken2022 = await isToken2022Account(connection, userTokenAta);
    const isBeneficiaryToken2022 = await isToken2022Account(connection, existingAta);

    console.log(isUserToken2022)
    console.log(isBeneficiaryToken2022)
  
  
      try {
        return program.methods
          .executeTransfer()
          .accounts({
            //@ts-ignore
            state: statePda,
            // owner: owner,
            beneficiary: beneficiary,
            payer: beneficiary,
            mint: mint,
            userTokenAccount: userTokenAta,
            beneficiaryTokenAccount: existingAta,
            tokenProgram: tokenProgramId,
            systemProgram: SystemProgram.programId,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          })
          .rpc();
      } catch (error) {
        console.error('Execute transfer error:', error);
        throw error;
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
      toast.success('Successfully claimed inheritance');
    },
    onError: (error: any) => {
      console.error('Error executing transfer:', error);
      toast.error(`Failed to claim inheritance: ${error.message}`);
    }
  });


  return {
    program,
    accounts,
    getProgramAccount,
    initializeState,
    getInheritanceState,
    checkDelegationStatus,
    checkDelegationStatusByOwner,
    updateDelegation,
    manualCheckin,
    revokeDelegation,
    executeTransfer,
    programId
  }
}

export function useInheritanceProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useInheritanceProgram()

  const accountQuery = useQuery({
    queryKey: ['inheritance', 'fetch', { cluster, account }],
    queryFn: () => program.account.state.fetch(account),
  });
}