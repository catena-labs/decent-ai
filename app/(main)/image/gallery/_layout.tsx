import { useActionSheet } from "@expo/react-native-action-sheet"
import { MenuView } from "@react-native-menu/menu"
import { useRouter } from "expo-router"
import { Drawer } from "expo-router/drawer"
import { MoreHorizontalIcon } from "lucide-react-native"
import { usePostHog } from "posthog-react-native"
import { useCallback } from "react"

import { DrawerContent } from "@/components/drawer/drawer-content"
import { DrawerToggleButton } from "@/components/drawer/drawer-toggle-button"
import { Pressable } from "@/components/elements/pressable"
import { View } from "@/components/elements/view"
import { useDeleteAllImages } from "@/hooks/images/use-delete-all-images"
import { useColors } from "@/hooks/use-colors"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"

export default function Layout() {
  const colors = useColors()

  return (
    <Drawer
      backBehavior="initialRoute"
      drawerContent={() => <DrawerContent />}
      screenOptions={{
        headerShown: true,
        swipeEdgeWidth: 200,
        headerLeft: () => <DrawerToggleButton />,
        headerRight: () => <OverflowMenu />,
        headerTitle: () => "",
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background
        }
      }}
    />
  )
}

function OverflowMenu() {
  const posthog = usePostHog()
  const router = useRouter()
  const { showActionSheetWithOptions } = useActionSheet()
  const { mutate: deleteAllImages } = useDeleteAllImages()

  const menuActions = [
    {
      id: "new-image",
      title: "Generate new image"
    },
    {
      id: "delete-all-images",
      title: "Delete all images",
      attributes: {
        destructive: true
      }
    }
  ]

  const showDeleteActionSheet = useCallback(() => {
    showActionSheetWithOptions(
      {
        title: "Are you sure you want to delete all of your images?",
        options: ["Cancel", "Delete"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1
      },
      (index) => {
        if (index === 1) {
          deleteAllImages()
        }
      }
    )
  }, [deleteAllImages, showActionSheetWithOptions])

  return (
    <View className="flex-row items-center bg-background">
      <MenuView
        actions={menuActions}
        onPressAction={({ nativeEvent }) => {
          if (nativeEvent.event === "new-image") {
            posthog.capture(ANALYTICS_EVENTS.IMAGE_GALLERY_NEW_IMAGE)
            router.push({
              pathname: "/image/generate"
            })
          } else if (nativeEvent.event === "delete-all-images") {
            posthog.capture(ANALYTICS_EVENTS.IMAGE_GALLERY_DELETE_ALL_IMAGES)
            showDeleteActionSheet()
          }
        }}
      >
        <Pressable
          analyticsEvent={ANALYTICS_EVENTS.IMAGE_GALLERY_OVERFLOW_MENU_OPENED}
          className="mr-3 size-11 items-end justify-center"
        >
          <MoreHorizontalIcon className="text-foreground" size={24} />
        </Pressable>
      </MenuView>
    </View>
  )
}
