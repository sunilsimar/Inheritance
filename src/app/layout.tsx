import './globals.css'
import {ClusterProvider} from '@/components/cluster/cluster-data-access'
import {SolanaProvider} from '@/components/solana/solana-provider'
import {UiLayout} from '@/components/ui/ui-layout'
import {ReactQueryProvider} from './react-query-provider'

export const metadata = {
  title: 'inheritance',
  description: 'Powered by Solana',
}

const links: { label: string; path: string }[] = [
  {label: 'Home', path: '/'},
  // { label: 'Account', path: '/account' },
  // { label: 'Clusters', path: '/clusters' },
  { label: 'Create Plan', path: '/inheritance' },
  {label: 'My Inheritance', path: '/details'},
  {label: 'Claim', path: '/claim'}
  // {label: 'Claim', path: '/claim'}
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <ClusterProvider>
            <SolanaProvider>
              <UiLayout links={links}>{children}</UiLayout>
            </SolanaProvider>
          </ClusterProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
