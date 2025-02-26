'use client'

import { ClaimInheritance } from '@/components/account/account-ui'
import { InheritanceList } from '@/components/inheritance/inheritance-feature'
import { WalletButton } from '@/components/solana/solana-provider';
import { useWallet } from '@solana/wallet-adapter-react'

export default function Page() {
  const {publicKey} = useWallet();
  
  return publicKey ? (
    <div>
      <ClaimInheritance/>
    </div>
  ) : (
        <div className="max-w-4xl mx-auto">
          <div className="hero py-[64px]">
            <div className="hero-content text-center">
              <WalletButton/>
            </div>
          </div>
        </div>
  )
}

