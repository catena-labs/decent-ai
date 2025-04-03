import "@walletconnect/react-native-compat"
import { handleResponse } from "@coinbase/wallet-mobile-sdk"
import { mainnet } from "@wagmi/core/chains"
import { coinbaseConnector } from "@web3modal/coinbase-wagmi-react-native"
import {
  Web3Modal,
  createWeb3Modal,
  defaultWagmiConfig
} from "@web3modal/wagmi-react-native"
import { type PropsWithChildren, useEffect } from "react"
import { Linking } from "react-native"
import { WagmiProvider } from "wagmi"

import { env } from "@/env"
import { appScheme } from "@/lib/constants"

const projectId = env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID

const metadata = {
  name: "DecentAI",
  description: "DecentAI",
  url: "https://decentai.xyz",
  icons: [],
  redirect: {
    native: `${appScheme}://`,
    universal: "mobile.decentai.app"
  }
}

const chains = [mainnet] as const

const coinbase = coinbaseConnector({
  redirect: `${appScheme}://`
})

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  extraConnectors: [coinbase]
})

createWeb3Modal({
  projectId,
  wagmiConfig,
  defaultChain: mainnet,
  enableAnalytics: false
})

function CoinbaseDeepLinkHandler() {
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      const handledBySdk = handleResponse(new URL(url))
      if (!handledBySdk) {
        // Handle other deeplinks
      }
    })

    return () => {
      sub.remove()
    }
  }, [])

  return null
}

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig}>
      {children}
      <CoinbaseDeepLinkHandler />
      <Web3Modal />
    </WagmiProvider>
  )
}
