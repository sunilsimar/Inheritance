'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { Account, LAMPORTS_PER_SOL, PublicKey, SendTransactionError, SystemProgram } from '@solana/web3.js'
import { IconRefresh } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppModal, ellipsify } from '../ui/ui-layout'
import { useCluster } from '../cluster/cluster-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ArrowRight, Clock, Wallet, UserPlus, RefreshCw, Coins, Shield, ChevronDown, ChevronUp,ChevronLeft, Lock, AlertCircle, Check  } from 'lucide-react';
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

     router.push('/details')
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message)
    }
  }

return (
  <div className="w-full max-w-2xl mx-auto p-4 sm:p-6"> {/* Adjusted padding */}
    <div className="card-glow rounded-2xl p-4 sm:p-8 space-y-6 sm:space-y-8"> {/* Responsive padding */}
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-sky-500" />
            <span className="neon-text">Inheritance Vault</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-400">Secure your digital legacy</p>
        </div>
        {delegationStatus?.isDelegated && (
          <div className="px-3 py-1 sm:px-4 sm:py-2 bg-sky-500/10 border border-sky-500/20 rounded-full">
            <span className="text-xs sm:text-sm text-sky-400 font-medium">Active Delegation</span>
          </div>
        )}
      </div>

      {/* Form section */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:gap-6">
          {/* Beneficiary Input - made responsive */}
          {!delegationStatus?.isDelegated && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-300 mb-2">
                <UserPlus size={16} className="text-sky-500" />
                Beneficiary Key
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl input-dark transition-all duration-200 text-sm sm:text-base"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="Enter beneficiary public key"
              />
            </div>
          )}

          {/* Token Selection - made responsive */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-300 mb-2">
              <Wallet size={16} className="text-sky-500" />
              Select Token
            </label>
            <select 
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl input-dark transition-all duration-200 text-sm sm:text-base"
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

          {/* Amount Input - made responsive */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-300">
                <ArrowRight size={16} className="text-sky-500" />
                Amount
              </label>
              {delegationStatus?.isDelegated ? (
                <span className="text-xs sm:text-sm text-sky-400">
                  Available: {availableBalance}
                </span>
              ) : (
                selectedTokenBalance > 0 && (
                  <span className="text-xs sm:text-sm text-sky-400">Balance: {selectedTokenBalance}</span>
                )
              )}
            </div>
            <input
              type="number"
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 text-sm sm:text-base ${
                error ? 'border-red-500/50 bg-red-500/5' : 'input-dark'
              }`}
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              max={selectedTokenBalance}
              step="any"
            />
            {error && (
              <p className="text-xs sm:text-sm text-red-400 mt-1">{error}</p>
            )}
          </div>

          {/* Duration Input - made responsive */}
          {!delegationStatus?.isDelegated && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-300 mb-2">
                <Clock size={16} className="text-sky-500" />
                Duration
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="number"
                  className="w-full sm:flex-1 px-3 py-2 sm:px-4 sm:py-3 rounded-xl input-dark transition-all duration-200 text-sm sm:text-base"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  placeholder="Duration"
                  min="1"
                />
                <select 
                  className="w-full sm:w-32 px-3 py-2 sm:px-4 sm:py-3 rounded-xl input-dark transition-all duration-200 text-sm sm:text-base"
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                >
                  <option value="minutes">Minutes</option>
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                ≈ {convertToSeconds(Number(durationValue), durationUnit)} seconds
              </p>
            </div>
          )}
        </div>

        {/* Buttons and Status - made responsive */}
        {delegationStatus?.isDelegated ? (
          <div className="mt-6 sm:mt-8 neon-border rounded-xl p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-sky-400">Current Delegation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
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
              className="w-full px-4 py-2 sm:px-6 sm:py-3 bg-sky-500 hover:bg-sky-600 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!amount || !!error || updateDelegation.isPending}
            >
              {updateDelegation.isPending ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  <RefreshCw size={18} />
                  Update Delegation
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            className="w-full mt-6 sm:mt-8 px-4 py-2 sm:px-6 sm:py-3 bg-sky-500 hover:bg-sky-600 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedToken || !amount || !!error || initializeState.isPending}
          >
            {initializeState.isPending ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                Create New Delegation
              </>
            )}
          </button>
        )}
      </form>
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
  <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto p-4">
    {states.map((state) => (
      <div key={state.publicKey} className="bg-[#0A0B0F] rounded-2xl p-4 sm:p-6 border border-gray-800">
        {/* Main Info Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4 sm:gap-0">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <div className="text-xs sm:text-sm text-gray-400">To</div>
              <ExplorerLink 
                label={ellipsify(state.account.beneficiary)} 
                path={`account/${state.account.beneficiary}`}
                className="text-sky-400 hover:text-sky-300 transition-colors text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-semibold text-white">{state.account.amount}</span>
              <span className="text-xs sm:text-sm text-gray-400">Tokens</span>
            </div>
          </div>
          
          {/* Status Badges */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
              ${state.account.currentBalance >= state.account.amount 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {state.account.currentBalance >= state.account.amount ? 'Sufficient Balance' : 'Insufficient Balance'}
            </div>
            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
              ${state.account.timeUntilExpiry > 0 
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {state.account.timeUntilExpiry > 0 ? 'Active' : 'Expired'}
            </div>
          </div>
        </div>

        {/* Info Pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 text-xs sm:text-sm text-gray-400">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
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

            {/* Warning Message */}
            {state.account.currentBalance < state.account.amount && (
              <div className="mt-4 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="font-medium text-red-400 mb-1 text-sm">Inheritance Transfer at Risk!</div>
                <div className="text-xs sm:text-sm text-gray-400">
                  Current balance ({state.account.currentBalance} Tokens) is insufficient for the delegated amount {state.account.amount} Tokens. 
                  The inheritance transfer will fail unless the balance is restored.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {publicKey?.toString() === state.account.owner && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-800">
            {state.account.timeUntilExpiry > 0 && (
              <button
                className="flex items-center justify-center gap-2 flex-1 px-3 sm:px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors"
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
              className="flex items-center justify-center gap-2 flex-1 px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors"
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

        {/* Details Toggle Button */}
        <button 
          className="flex items-center justify-center gap-1 w-full mt-3 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
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
  const router = useRouter();
  const { publicKey } = useWallet();
  const [ownerAddress, setOwnerAddress] = useState('');
  const [error, setError] = useState('');
  const { executeTransfer, checkDelegationStatusByOwner } = useInheritanceProgram();
  const [loading, setLoading] = useState(false);
  const [ownerDelegations, setOwnerDelegations] = useState<any[]>([]);
  const [isCheckingDelegations, setIsCheckingDelegations] = useState(false);
  const [claimingDelegation, setClaimingDelegation] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

// Add a new function to check delegations
const checkOwnerDelegations = async (ownerPubkey: PublicKey) => {
  try {
    setIsCheckingDelegations(true);
    const status = await checkDelegationStatusByOwner(ownerPubkey);
    if (status?.delegations?.length) {
      setOwnerDelegations(status.delegations);
    } else {
      setOwnerDelegations([]);
    }
  } catch (error) {
    console.error('Error checking delegations:', error);
  } finally {
    setIsCheckingDelegations(false);
  }
};
  
  const handleClaimDelegation = async (delegation: any) => {
    if (!publicKey) return;
  
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
  
      const ownerPubkey = new PublicKey(ownerAddress);
  
      await executeTransfer.mutateAsync({
        owner: ownerPubkey,
        userTokenAta: new PublicKey(delegation.tokenAccount),
        beneficiary: publicKey,
        mint: new PublicKey(delegation.mintAccount),
      });
  
      // Update the UI by removing the claimed delegation
      setOwnerDelegations(prevDelegations => 
        prevDelegations.filter(d => d.tokenAccount !== delegation.tokenAccount)
      );
  
      // Show success notification
      setSuccessMessage('Successfully claimed inheritance!');
    } catch (err: any) {
      console.error('Error claiming delegation:', err);
      setError(err.message || 'Failed to claim delegation');
    } finally {
      setLoading(false);
      setClaimingDelegation(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        {/* Enhanced Background Gradients */}
        <div className="absolute inset-0 bg-black">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-sky-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-sky-500/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-600/5 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Navigation */}
          <nav className="mb-12">
            <button 
              onClick={() => router.push('/inheritance')} 
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </nav>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Main Content */}
            <div>
              <div className="text-left mb-8">
                <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
                  Claim Your Inheritance
                </h1>
                <p className="text-base md:text-lg text-gray-400 leading-relaxed">
                  Complete the verification process to claim your inherited digital assets securely on the Solana blockchain.
                </p>
              </div>
            <div className="bg-[#0A0B0F] rounded-xl p-4 sm:p-6 border border-gray-800/50 hover:border-sky-500/50 transition-all duration-300">
              <div className="space-y-4">
                <div className="max-w-lg"> {/* Added max-width constraint */}
                  <label className="text-xs sm:text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                    <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400" />
                    Owner&apos;s Public Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm rounded-xl bg-gray-900/50 border border-gray-800 focus:border-sky-500/50 transition-all duration-200"
                      value={ownerAddress}
                      onChange={(e) => setOwnerAddress(e.target.value)}
                      placeholder="Enter owner's public key"
                      disabled={loading || isCheckingDelegations}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const ownerPubkey = new PublicKey(ownerAddress);
                          checkOwnerDelegations(ownerPubkey);
                        } catch {
                          setError('Invalid owner address');
                        }
                      }}
                      disabled={!ownerAddress || isCheckingDelegations}
                      className="px-3 py-2 sm:px-4 sm:py-2.5 bg-sky-500 hover:bg-sky-600 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 whitespace-nowrap text-xs sm:text-sm"
                    >
                      {isCheckingDelegations ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        'Check'
                      )}
                    </button>
                  </div>
                    {error && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    )}
                      {successMessage && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm mt-2">
                      <Check className="w-4 h-4" />
                      <span>{successMessage}</span>
                    </div>
                  )}
                  </div>

                  {ownerDelegations.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-200">Available Delegations</h3>
                      <div className="space-y-3">
                        {ownerDelegations.map((delegation, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-sky-500/50 transition-all"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-300">
                                Amount: {delegation.amount} Tokens
                              </span>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                delegation.timeUntilExpiry > 0
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {delegation.timeUntilExpiry > 0 
                                  ? `Expires in ${Math.floor(delegation.timeUntilExpiry / 60)} minutes`
                                  : 'Ready to Claim'
                                }
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setClaimingDelegation(delegation.tokenAccount);
                                handleClaimDelegation(delegation);
                              }}
                              disabled={delegation.timeUntilExpiry > 0 || claimingDelegation === delegation.tokenAccount}
                              className="w-full px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
                            >
                              {claimingDelegation === delegation.tokenAccount ? (
                                <div className="flex items-center justify-center gap-2">
                                  <RefreshCw size={14} className="animate-spin" />
                                  <span>Processing...</span>
                                </div>
                              ) : (
                                'Claim Delegation'
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-6">
              <div className="bg-[#0A0B0F] rounded-xl p-6 border border-gray-800/50 hover:border-sky-500/50 transition-all duration-300">
                <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-base font-semibold mb-2">Security Measures</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>
                    Multi-signature verification
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>
                    48-hour security timelock
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full"></div>
                    Automated fraud detection
                  </li>
                </ul>
              </div>

              <div className="bg-[#0A0B0F] rounded-xl p-6 border border-gray-800/50 hover:border-sky-500/50 transition-all duration-300">
                <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-base font-semibold mb-2">Transaction Details</h3>
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex justify-between items-center">
                    <span>Processing Time</span>
                    <span className="text-white">~30 seconds</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Network Fee</span>
                    <span className="text-white">0.001 SOL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Security Deposit</span>
                    <span className="text-white">None required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-24 pt-6 border-t border-gray-800/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Proudly built on Solana</span>
              </div>
                <div className="flex gap-4 text-gray-400">
                {/* <a href="#" className="text-xs hover:text-sky-400 transition-colors">Terms</a>
                <a href="#" className="text-xs hover:text-sky-400 transition-colors">Privacy</a>
                <a href="#" className="text-xs hover:text-sky-400 transition-colors">Documentation</a>
                <a href="#" className="text-xs hover:text-sky-400 transition-colors">Security</a>
                <a href="#" className="text-xs hover:text-sky-400 transition-colors">Contact</a> */}
                <a href="https://github.com/sunilsimar/inheritance" className="text-xs hover:text-sky-400 transition-colors">GitHub</a>
                </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );


}