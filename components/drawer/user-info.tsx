import { type Address, isAddress } from "viem"
import { useEnsName } from "wagmi"

import { Text } from "@/components/elements/text"
import { UserAvatar } from "@/components/elements/user-avatar"
import { View, type ViewProps } from "@/components/elements/view"
import { type User } from "@/lib/auth/types"
import { formatAddress } from "@/lib/crypto-fns/format-address"
import { cn } from "@/lib/utils/cn"

export type UserInfoProps = ViewProps & {
  user: User
}

export function UserInfo({ user, className, ...props }: UserInfoProps) {
  const { data: ensName } = useEnsName({
    address: user.name as Address,
    query: {
      enabled: isAddress(user.name)
    }
  })

  return (
    <View className={cn("flex-row items-center gap-2", className)} {...props}>
      <View className="size-7">
        <UserAvatar user={user} />
      </View>
      <View className="flex-1">
        {isAddress(user.name) ? (
          <>
            {ensName ? <Text className="line-clamp-1">{ensName}</Text> : null}

            <Text variant="mono" className="line-clamp-1 text-xs">
              {formatAddress(user.name)}
            </Text>
          </>
        ) : (
          <>
            <Text className="line-clamp-1">{user.name}</Text>
            {user.email ? (
              <Text className="line-clamp-1 text-xs">{user.email}</Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  )
}
