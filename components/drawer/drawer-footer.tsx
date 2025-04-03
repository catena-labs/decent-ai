import { View } from "@/components/elements/view"
import { useAuthentication } from "@/hooks/use-authentication"

import { OverflowMenu } from "./overflow-menu"
import { UserInfo } from "./user-info"

export function DrawerFooter() {
  const { user } = useAuthentication()

  return (
    <View className="line-clamp-1 flex-row items-center gap-2 px-2">
      {user ? <UserInfo className="flex-1" user={user} /> : null}
      <View className="size-11 shrink-0 items-center justify-center">
        <OverflowMenu />
      </View>
    </View>
  )
}
