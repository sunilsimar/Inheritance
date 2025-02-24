'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { Account, LAMPORTS_PER_SOL, PublicKey, SendTransactionError, SystemProgram } from '@solana/web3.js'
import { IconRefresh } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppModal, ellipsify } from '../ui/ui-layout'
import { useCluster } from '../cluster/cluster-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ArrowRight, Clock, Wallet, UserPlus, RefreshCw, Coins, Shield, ChevronDown, ChevronUp  } from 'lucide-react';
import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
} from './account-data-access'
import { DOT_NEXT_ALIAS } from 'next/dist/lib/constants'
import { amountToUiAmount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { token } from '@coral-xyz/anchor/dist/cjs/utils'
import { BN } from 'bn.js'
import { DelegationStatus, useInheritanceProgram } from '../inheritance/inheritance-data-access'
import { debounce } from 'lodash'
import { useRouter } from 'next/navigation'


export function AccountBalance({ address }: { address: PublicKey }) {
  const query = useGetBalance({ address })

  return (
    <div>
      <h1 className="text-5xl font-bold cursor-pointer" onClick={() => query.refetch()}>
        {query.data ? <BalanceSol balance={query.data} /> : '...'} SOL
      </h1>
    </div>
  )
}
export function AccountChecker() {
  const { publicKey } = useWallet()
  if (!publicKey) {
    return null
  }
  return <AccountBalanceCheck address={publicKey} />
}
export function AccountBalanceCheck({ address }: { address: PublicKey }) {
  const { cluster } = useCluster()
  const mutation = useRequestAirdrop({ address })
  const query = useGetBalance({ address })

  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data) {
    return (
      <div className="alert alert-warning text-warning-content/80 rounded-none flex justify-center">
        <span>
          You are connected to <strong>{cluster.name}</strong> but your account is not found on this cluster.
        </span>
        <button
          className="btn btn-xs btn-neutral"
          onClick={() => mutation.mutateAsync(1).catch((err) => console.log(err))}
        >
          Request Airdrop
        </button>
      </div>
    )
  }
  return null
}

export function AccountButtons({ address }: { address: PublicKey }) {
  const wallet = useWallet()
  const { cluster } = useCluster()
  const [showAirdropModal, setShowAirdropModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  return (
    <div>
      <ModalAirdrop hide={() => setShowAirdropModal(false)} address={address} show={showAirdropModal} />
      <ModalReceive address={address} show={showReceiveModal} hide={() => setShowReceiveModal(false)} />
      <ModalSend address={address} show={showSendModal} hide={() => setShowSendModal(false)} />
      <div className="space-x-2">
        <button
          disabled={cluster.network?.includes('mainnet')}
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowAirdropModal(true)}
        >
          Airdrop
        </button>
        <button
          disabled={wallet.publicKey?.toString() !== address.toString()}
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowSendModal(true)}
        >
          Send
        </button>
        <button className="btn btn-xs lg:btn-md btn-outline" onClick={() => setShowReceiveModal(true)}>
          Receive
        </button>
      </div>
    </div>
  )
}

export function AccountTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false)
  const query = useGetTokenAccounts({ address })
  const client = useQueryClient()
  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-2">
      <div className="justify-between">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Token Accounts</h2>
          <div className="space-x-2">
            {query.isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <button
                className="btn btn-sm btn-outline"
                onClick={async () => {
                  await query.refetch()
                  await client.invalidateQueries({
                    queryKey: ['getTokenAccountBalance'],
                  })
                }}
              >
                <IconRefresh size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {query.isError && <pre className="alert alert-error">Error: {query.error?.message.toString()}</pre>}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No token accounts found.</div>
          ) : (
            <table className="table border-4 rounded-lg border-separate border-base-300">
              <thead>
                <tr>
                  <th>Public Key</th>
                  <th>Mint</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {items?.map(({ account, pubkey }) => (
                  <tr key={pubkey.toString()}>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink label={ellipsify(pubkey.toString())} path={`account/${pubkey.toString()}`} />
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(account.data.parsed.info.mint)}
                            path={`account/${account.data.parsed.info.mint.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="font-mono">{account.data.parsed.info.tokenAmount.uiAmount}</span>
                    </td>
                  </tr>
                ))}

                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      <button className="btn btn-xs btn-outline" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
         {/* <InheritanceForm address={address} /> */}
    </div>
  )
}

export function AccountTransactions({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address })
  const [showAll, setShowAll] = useState(false)

  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="space-x-2">
          {query.isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <button className="btn btn-sm btn-outline" onClick={() => query.refetch()}>
              <IconRefresh size={16} />
            </button>
          )}
        </div>
      </div>
      {query.isError && <pre className="alert alert-error">Error: {query.error?.message.toString()}</pre>}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No transactions found.</div>
          ) : (
            <table className="table border-4 rounded-lg border-separate border-base-300">
              <thead>
                <tr>
                  <th>Signature</th>
                  <th className="text-right">Slot</th>
                  <th>Block Time</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item) => (
                  <tr key={item.signature}>
                    <th className="font-mono">
                      <ExplorerLink path={`tx/${item.signature}`} label={ellipsify(item.signature, 8)} />
                    </th>
                    <td className="font-mono text-right">
                      <ExplorerLink path={`block/${item.slot}`} label={item.slot.toString()} />
                    </td>
                    <td>{new Date((item.blockTime ?? 0) * 1000).toISOString()}</td>
                    <td className="text-right">
                      {item.err ? (
                        <div className="badge badge-error" title={JSON.stringify(item.err)}>
                          Failed
                        </div>
                      ) : (
                        <div className="badge badge-success">Success</div>
                      )}
                    </td>
                  </tr>
                ))}
                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      <button className="btn btn-xs btn-outline" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function BalanceSol({ balance }: { balance: number }) {
  return <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
}

function ModalReceive({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  return (
    <AppModal title="Receive" hide={hide} show={show}>
      <p>Receive assets by sending them to your public key:</p>
      <code>{address.toString()}</code>
    </AppModal>
  )
}

function ModalAirdrop({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  const mutation = useRequestAirdrop({ address })
  const [amount, setAmount] = useState('2')

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Airdrop"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount)).then(() => hide())}
    >
      <input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  )
}

function ModalSend({ hide, show, address }: { hide: () => void; show: boolean; address: PublicKey }) {
  const wallet = useWallet()
  const mutation = useTransferSol({ address })
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')

  if (!address || !wallet.sendTransaction) {
    return <div>Wallet not connected</div>
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Send"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={() => {
        mutation
          .mutateAsync({
            destination: new PublicKey(destination),
            amount: parseFloat(amount),
          })
          .then(() => hide())
      }}
    >
      <input
        disabled={mutation.isPending}
        type="text"
        placeholder="Destination"
        className="input input-bordered w-full"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  )
}

// Add this type for duration unit
type DurationUnit = 'minutes' | 'days' | 'months';

// Add these helper functions
const convertToSeconds = (value: number, unit: DurationUnit): number => {
  const SECONDS_PER_MINUTE = 60;
  const SECONDS_PER_DAY = 86400;
  const SECONDS_PER_MONTH = SECONDS_PER_DAY * 30; // Approximate

  switch (unit) {
    case 'minutes':
      return value * SECONDS_PER_MINUTE;
    case 'days':
      return value * SECONDS_PER_DAY;
    case 'months':
      return value * SECONDS_PER_MONTH;
    default:
      return value * SECONDS_PER_MONTH;
  }
};



// Add this new component
export function InheritanceForm({ address }: { address: PublicKey }) {
  const { publicKey } = useWallet()
  const [beneficiary, setBeneficiary] = useState('')
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState('60000') // Default 60 seconds
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [durationValue, setDurationValue] = useState('1');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('months');
  const [delegationStatus, setDelegationStatus] = useState<DelegationStatus | null>(null);
  const tokenQuery = useGetTokenAccounts({ address });
  const router = useRouter();
  const checkedTokens = useRef<Set<string>>(new Set());
  const { initializeState, checkDelegationStatus, updateDelegation } = useInheritanceProgram();

const debouncedCheckTokenStatus = useCallback(
  debounce(async (tokenPubkey: PublicKey) => {
    try {
      if (!tokenPubkey) return;
      const status = await checkDelegationStatus(tokenPubkey);
      setDelegationStatus(status);
    } catch (error) {
      console.error('Error checking delegation status:', error);
    }
  }, 1000),
  [checkDelegationStatus]
);

const calculateAvailableBalance = (totalBalance: number, delegatedAmount: number) => {
  return Math.max(0, totalBalance - delegatedAmount);
};


const renderDurationInput = () => {
  if (delegationStatus?.isDelegated) return null;

  return (
    <div>
      <label className="label">Duration</label>
      <div className="join w-full">
        <input
          type="number"
          className="input input-bordered join-item w-2/3"
          value={durationValue}
          onChange={(e) => setDurationValue(e.target.value)}
          placeholder="Enter duration"
          min="1"
        />
         <select 
            className="select select-bordered join-item w-1/3"
            value={durationUnit}
            onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
          >
           <option value="minutes">Minutes</option>
          <option value="days">Days</option>
          <option value="months">Months</option>
          </select>
        </div>
        <label className="label">
          <span className="label-text-alt">
            Equivalent to {convertToSeconds(Number(durationValue), durationUnit)} seconds
          </span>
        </label>
      </div>
    );
  };

useEffect(() => {
  if (!selectedToken || !tokenQuery.data) return;

  const tokenAccount = tokenQuery.data.find(
    ({ account }) => account.data.parsed.info.mint === selectedToken
  );

  if (tokenAccount) {
    checkedTokens.current.add(tokenAccount.pubkey.toString());
    debouncedCheckTokenStatus(tokenAccount.pubkey); // ✅ Always check status
  }

  return () => {
    debouncedCheckTokenStatus.cancel();
  };
}, [selectedToken, tokenQuery.data]);


  const selectedTokenBalance = useMemo(() => {
    if (!selectedToken || !tokenQuery.data) return 0
    const tokenAccount = tokenQuery.data.find(
      ({ account }) => account.data.parsed.info.mint === selectedToken
    )
    return tokenAccount?.account.data.parsed.info.tokenAmount.uiAmount || 0
  }, [selectedToken, tokenQuery.data])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);

    if (delegationStatus?.isDelegated) {
      if (parseFloat(value) > availableBalance) {
        setError(`Amount exceeds available balance of ${availableBalance}`);
      } else {
        setError('');
      }
    } else {
      if (parseFloat(value) > selectedTokenBalance) {
        setError(`Amount exceeds balance of ${selectedTokenBalance}`);
      } else {
        setError('');
      }
    }
  };

  const handleTokenSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSelectedToken = e.target.value;
    setSelectedToken(newSelectedToken);
    
    setDelegationStatus(null); 
    setAmount('');
    setError('');
    
    checkedTokens.current.clear(); 
  };
  
   // Calculate available balance
  const availableBalance = useMemo(() => {
    if (!selectedToken || !tokenQuery.data || !delegationStatus?.isDelegated) return selectedTokenBalance;
    return calculateAvailableBalance(
      selectedTokenBalance,
      delegationStatus.existingDelegation?.amount || 0
    );
  }, [selectedToken, tokenQuery.data, selectedTokenBalance, delegationStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey) return

    if (parseFloat(amount) > selectedTokenBalance) {
      setError(`Amount exceeds balance of ${selectedTokenBalance}`)
      return
    }

    // Get token account from existing query data
    const tokenAccount = tokenQuery.data?.find(
      ({ account }) => account.data.parsed.info.mint === selectedToken
    )

    if(!tokenAccount){
      setError("Token Account not found")
      return
    }

    const [statePDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('inheritance'),
        publicKey.toBuffer(),
        tokenAccount.pubkey.toBuffer() // Make sure this matches the token account in logs
      ],
      new PublicKey("CRpkPb9EwbMSvNiyiMD4nqAdGJZGwdcS69vBZq77VZUn")
    );

    // Debug log to verify accounts
    console.log({
      mint: selectedToken,
      owner: publicKey.toString(),
      tokenAccount: tokenAccount.pubkey.toString(),
      derivedPDA: statePDA.toString(),
    });

    try {
      if(publicKey){
        if( delegationStatus?.isDelegated){
          await updateDelegation.mutateAsync({
            owner: publicKey,
            amount: parseFloat(amount),
            userTokenAta: tokenAccount?.pubkey,
          })
        } else{  
          await initializeState.mutateAsync({
            owner: publicKey,
            beneficiary: new PublicKey(beneficiary),
            amount: parseFloat(amount), 
            duration: convertToSeconds(Number(durationValue), durationUnit),
            //@ts-ignore
            userTokenAta: tokenAccount?.pubkey,
          })}
      }
      setBeneficiary('');
      setAmount('');
      setDurationValue('1');
      setSelectedToken('');
      setDelegationStatus(null);
      setError('');
      checkedTokens.current.clear();

     router.push('/inheritance/details')
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message)
    }
  }

return (
  <div className="max-w-2xl mx-auto p-6">
    <div className="card-glow rounded-2xl p-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-sky-500" />
            <span className="neon-text">Inheritance Vault</span>
          </h2>
          <p className="text-gray-400">Secure your digital legacy</p>
        </div>
        {delegationStatus?.isDelegated && (
          <div className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-full">
            <span className="text-sky-400 text-sm font-medium">Active Delegation</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6">
          {/* Beneficiary Input */}
          {!delegationStatus?.isDelegated && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <UserPlus size={16} className="text-sky-500" />
              Beneficiary Key
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl input-dark transition-all duration-200"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="Enter beneficiary public key"
            />
          </div>
          )}

          {/* Token Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Wallet size={16} className="text-sky-500" />
              Select Token
            </label>
            <select 
              className="w-full px-4 py-3 rounded-xl input-dark transition-all duration-200"
              value={selectedToken}
              onChange={handleTokenSelect}
            >
              <option value="">Choose token</option>
              {tokenQuery.data?.map(({ account, pubkey }) => (
                <option key={pubkey.toString()} value={account.data.parsed.info.mint}>
                  {account.data.parsed.info.mint} ({account.data.parsed.info.tokenAmount.uiAmount})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <ArrowRight size={16} className="text-sky-500" />
                Amount
              </label>
              {delegationStatus?.isDelegated ? (
                <span className="text-sm text-sky-400">
                  Available: {availableBalance}
                </span>
              ) : (
                selectedTokenBalance > 0 && (
                  <span className="text-sm text-sky-400">Balance: {selectedTokenBalance}</span>
                )
              )}
            </div>
            <input
              type="number"
              className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                error ? 'border-red-500/50 bg-red-500/5' : 'input-dark'
              }`}
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              max={selectedTokenBalance}
              step="any"
            />
            {error && (
              <p className="text-sm text-red-400 mt-1">{error}</p>
            )}
          </div>

          {/* Duration Input */}
          {!delegationStatus?.isDelegated && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Clock size={16} className="text-sky-500" />
                Duration
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  className="flex-1 px-4 py-3 rounded-xl input-dark transition-all duration-200"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  placeholder="Duration"
                  min="1"
                />
                <select 
                  className="w-32 px-4 py-3 rounded-xl input-dark transition-all duration-200"
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                >
                  <option value="minutes">Minutes</option>
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
              <p className="text-sm text-gray-500">
                ≈ {convertToSeconds(Number(durationValue), durationUnit)} seconds
              </p>
            </div>
          )}
        </div>

        {/* Delegation Status and Submit Button */}
        {delegationStatus?.isDelegated ? (
          <div className="mt-8 neon-border rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-sky-400">Current Delegation</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Amount</p>
                  <p className="text-white font-medium">{delegationStatus.existingDelegation?.amount ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-400">Beneficiary</p>
                  <p className="text-white font-medium">{ellipsify(delegationStatus.existingDelegation?.beneficiary || '')}</p>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-sky-500 hover:bg-sky-600 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!amount || !!error || updateDelegation.isPending}
            >
              {updateDelegation.isPending ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <>
                  <RefreshCw size={20} />
                  Update Delegation
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full mt-8 px-6 py-3 bg-sky-500 hover:bg-sky-600 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedToken || !amount || !!error || initializeState.isPending}
          >
            {initializeState.isPending ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <>
                <UserPlus size={20} />
                Create New Delegation
              </>
            )}
          </button>
        )}
      </form>

      {/* <InheritanceDetails /> */}
      <ClaimInheritance />
    </div>
  </div>
);
}

const DECIMALS = 9;

const formatTokenAmount = (lamports: number): number => {
  return lamports / Math.pow(10, DECIMALS);
};



export function InheritanceDetails() {
  const { getInheritanceState, manualCheckin, revokeDelegation } = useInheritanceProgram();
  const { publicKey }  = useWallet();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [checkinLoadingStates, setCheckinLoadingStates] = useState<Record<string, boolean>>({});
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});

  if (getInheritanceState.isLoading) {
    return <div>Loading inheritance details...</div>;
  }

  if (getInheritanceState.isError) {
    return <div className="alert alert-error">
      Error loading inheritance: {getInheritanceState.error.message}
    </div>;
  }


  // Handle array of states
  const states = getInheritanceState.data;
  if (!states || states.length === 0) {
    return <div>No inheritances found</div>;
  }

  const ManualCheckIn = async (state: any) => {
    const stateKey = state.publicKey.toString();
    try {
      if(!publicKey) return;

      if (!state?.account?.userTokenAccount) {
        console.error('Invalid state or missing userTokenAccount');
        return;
      }

      // Set loading state for this specific check-in
      setCheckinLoadingStates(prev => ({
        ...prev,
        [stateKey]: true
      }));

      await manualCheckin.mutateAsync({
        owner: publicKey,
        userTokenAta: new PublicKey(state.account.userTokenAccount)
      });
    } catch(error) {
      console.error('Error during manual check-in', error);
    } finally {
      // Clear loading state
      setCheckinLoadingStates(prev => ({
        ...prev,
        [stateKey]: false
      }));
    }
  };


  const RevokeDelegation = async(state: any) => {
    const stateKey = state.publicKey.toString();
    try {
      if(!publicKey) return;

      if(!state?.account?.userTokenAccount){
        console.error('Invalid state or missing userTokenAccount');
        return;
      }

      // Set loading state for this specific delegation
      setLoadingStates(prev => ({
        ...prev,
        [stateKey]: true
      }));

      await revokeDelegation.mutateAsync({
        owner: publicKey,
        userTokenAta: new PublicKey(state.account.userTokenAccount)
      });
    } catch(error) {
      console.error('Error in revoking delegation', error)
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({
        ...prev,
        [stateKey]: false
      }));
    }
  };

const toggleDetails = (stateKey: string) => {
  setExpandedStates(prev => ({
    ...prev,
    [stateKey]: !prev[stateKey]
  }));
};

return (
  <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto">
    {states.map((state) => (
      <div key={state.publicKey} className="bg-[#0A0B0F] rounded-2xl p-6 border border-gray-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm text-gray-400">To</div>
              <ExplorerLink 
                label={ellipsify(state.account.beneficiary)} 
                path={`account/${state.account.beneficiary}`}
                className="text-sky-400 hover:text-sky-300 transition-colors"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-white">{state.account.amount}</span>
              <span className="text-sm text-gray-400">Tokens</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium 
              ${state.account.currentBalance >= state.account.amount 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {state.account.currentBalance >= state.account.amount ? 'Sufficient Balance' : 'Insufficient Balance'}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium
              ${state.account.timeUntilExpiry > 0 
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {state.account.timeUntilExpiry > 0 ? 'Active' : 'Expired'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            {state.account.timeUntilExpiry > 0 ? (
              <span className="text-sky-400">
                Expires in {Math.floor(state.account.timeUntilExpiry / 60)} minutes
              </span>
            ) : (
              <span className="text-red-400">Expired</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ArrowRight size={14} />
            <span>Balance: {state.account.currentBalance} Tokens</span>
          </div>
        </div>

        {/* Expanded Details */}
        {expandedStates[state.publicKey.toString()] && (
          <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400 mb-1">State Account</div>
                <ExplorerLink 
                  label={ellipsify(state.publicKey)} 
                  path={`account/${state.publicKey}`}
                  className="text-sky-400 hover:text-sky-300 transition-colors"
                />
              </div>
              <div>
                <div className="text-gray-400 mb-1">Owner</div>
                <ExplorerLink 
                  label={ellipsify(state.account.owner)} 
                  path={`account/${state.account.owner}`}
                  className="text-sky-400 hover:text-sky-300 transition-colors"
                />
              </div>
              <div>
                <div className="text-gray-400 mb-1">Duration</div>
                <div className="text-white">{state.account.duration} seconds</div>
              </div>
              <div>
                <div className="text-gray-400 mb-1">Last Check-in</div>
                <div className="text-white">{new Date(state.account.lastCheckin * 1000).toLocaleString()}</div>
              </div>
            </div>

            {state.account.currentBalance < state.account.amount && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="font-medium text-red-400 mb-1">Inheritance Transfer at Risk!</div>
                <div className="text-sm text-gray-400">
                  Current balance ({state.account.currentBalance} Tokens) is insufficient for the delegated amount {state.account.amount} Tokens. 
                  The inheritance transfer will fail unless the balance is restored.
                </div>
              </div>
            )}
          </div>
        )}

        {publicKey?.toString() === state.account.owner && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
            {state.account.timeUntilExpiry > 0 && (
            <button
              className="flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors"
              onClick={() => ManualCheckIn(state)}
              disabled={checkinLoadingStates[state.publicKey.toString()]}
            >
              {checkinLoadingStates[state.publicKey.toString()] ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                'Check In'
              )}
            </button>
          )}
          <button
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
            onClick={() => RevokeDelegation(state)}
            disabled={loadingStates[state.publicKey.toString()]}
          >
            {loadingStates[state.publicKey.toString()] ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              'Remove Delegation'
            )}
          </button>
          </div>
        )}

        <button 
          className="flex items-center justify-center gap-1 w-full mt-3 text-sm text-gray-400 hover:text-white transition-colors"
          onClick={() => toggleDetails(state.publicKey.toString())}
        >
          {expandedStates[state.publicKey.toString()] ? (
            <>
              Hide Details
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              View Details
              <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>
    ))}
  </div>
);
}


export function ClaimInheritance() {
  const { publicKey } = useWallet();
  const [ownerAddress, setOwnerAddress] = useState('');
  const [error, setError] = useState('');
  const { executeTransfer, checkDelegationStatusByOwner } = useInheritanceProgram();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    try {
      setLoading(true);
      setError('');

      // Validate owner address
      let ownerPubkey: PublicKey;
      try {
        ownerPubkey = new PublicKey(ownerAddress);
      } catch {
        setError('Invalid owner address');
        return;
      }

      // Check if there's an expired delegation
      const status = await checkDelegationStatusByOwner(ownerPubkey);
      
      if (!status?.isDelegated) {
        setError('No delegation found for this owner');
        return;
      }

      if (status.existingDelegation?.timeUntilExpiry && status.existingDelegation.timeUntilExpiry > 0) {
        setError('Delegation has not expired yet');
        return;
      }


      console.log('token account:', status.existingDelegation?.tokenAccount.toBase58())

      if (status.existingDelegation?.tokenAccount instanceof PublicKey) {
        console.log('Token Account:', status.existingDelegation.tokenAccount.toBase58());
      } else {
        console.log('Raw Token Account:', status.existingDelegation?.tokenAccount);
        // Convert to PublicKey if it's a string
        const tokenAccountPubkey = status.existingDelegation?.tokenAccount ? new PublicKey(status.existingDelegation.tokenAccount) : null;
        if (tokenAccountPubkey) {
          console.log('Converted Token Account:', tokenAccountPubkey.toBase58());
        } else {
          console.log('Token Account is null');
        }
      }
      

      await executeTransfer.mutateAsync({
        owner: ownerPubkey,
        //@ts-ignore
        userTokenAta: status.existingDelegation?.tokenAccount,
        beneficiary: publicKey,
        mint: status.existingDelegation?.mintAccount!,
      });

      setOwnerAddress('');
      // Show success message or handle UI updates
    } catch (err: any) {
      console.error('Error claiming inheritance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Claim Inheritance</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Owner&apos;s Public Key</span>
            </label>
            <input
              type="text"
              className={`input input-bordered w-full ${error ? 'input-error' : ''}`}
              value={ownerAddress}
              onChange={(e) => setOwnerAddress(e.target.value)}
              placeholder="Enter owner's public key"
              disabled={loading}
            />
            {error && <div className="text-error text-sm mt-1">{error}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={!ownerAddress || loading}
          >
            {loading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              'Claim Tokens'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}