import { type Address, isAddress } from "viem"
import { normalize } from "viem/ens"
import { useEnsAvatar, useEnsName } from "wagmi"

import { type User } from "@/lib/auth/types"
import { getInitials } from "@/lib/utils/string-fns/get-initials"

import { Avatar, type AvatarProps } from "./avatar"

export type UserAvatarProps = Omit<AvatarProps, "colors"> & {
  user?: User | null
}

export function UserAvatar({ user, ...props }: UserAvatarProps) {
  const { data: ensName } = useEnsName({
    address: user?.name as Address | undefined,
    query: {
      enabled: isAddress(user?.name ?? "")
    }
  })

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    query: {
      enabled: Boolean(ensName)
    }
  })

  return (
    <Avatar
      colors={["#A276FF", "#D97CD6"]}
      url={ensAvatar ?? user?.image}
      fallbackText={getInitials(user?.name)}
      {...props}
    />
  )
}
