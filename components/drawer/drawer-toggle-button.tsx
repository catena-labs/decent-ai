import { type DrawerNavigationProp } from "@react-navigation/drawer"
import { type ParamListBase } from "@react-navigation/native"
import { useNavigation } from "expo-router"
import { MenuIcon } from "lucide-react-native"
import { Keyboard } from "react-native"

import { Pressable, type PressableProps } from "@/components/elements/pressable"

export type DrawerToggleButtonProps = PressableProps

/**
 * A custom Drawer Toggle button used in the header
 */
export function DrawerToggleButton(props: DrawerToggleButtonProps) {
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>()

  return (
    <Pressable
      className="ml-3 size-11 items-center justify-center bg-background"
      {...props}
      haptics
      onPress={() => {
        Keyboard.dismiss()
        navigation.openDrawer()
      }}
    >
      <MenuIcon className="text-foreground" size={24} />
    </Pressable>
  )
}
