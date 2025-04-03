import { type Address, type WalletClient } from "viem"

export type EthersWalletClient = {
  getAddress: () => Promise<Address>
  signMessage: (message: string) => Promise<string>
}

export function walletClientToEthers(
  walletClient: WalletClient
): EthersWalletClient {
  return {
    getAddress: async (): Promise<Address> => {
      if (!walletClient.account) {
        throw new Error("No account")
      }

      return Promise.resolve(walletClient.account.address)
    },
    signMessage: async (message: string): Promise<string> => {
      if (!walletClient.account) {
        throw new Error("No account")
      }
      return walletClient.signMessage({
        account: walletClient.account,
        message
      })
    }
  }
}
