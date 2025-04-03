import { useLocalSearchParams } from "expo-router"
import { Drawer } from "expo-router/drawer"
import { useEffect } from "react"

import { DrawerContent } from "@/components/drawer/drawer-content"
import { DrawerToggleButton } from "@/components/drawer/drawer-toggle-button"
import { HeaderModelSelect } from "@/components/layout/header-model-select"
import { useColors } from "@/hooks/use-colors"
import { useImageGenState } from "@/hooks/use-image-gen-state"
import { useModel } from "@/hooks/use-model"
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
        headerTitle: () => <HeaderTitleButton />,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background
        }
      }}
    />
  )
}

type SearchParams = {
  image?: string
  modelSlug?: string
}

function HeaderTitleButton() {
  const { modelSlug } = useLocalSearchParams<SearchParams>()

  const [currentModelSlug, setCurrentModelSlug] = useImageGenState((state) => [
    state.currentModelSlug,
    state.setCurrentModelSlug
  ])

  /**
   * If loading a preixisting image, set the model slug to the model slug in the image.
   * This controls the model slug used for image generation.
   */
  useEffect(() => {
    if (modelSlug) {
      setCurrentModelSlug(modelSlug)
    }
  }, [modelSlug, setCurrentModelSlug])

  // If a specific image is provided, use the model from the image. Otherwise,
  // use the last selected model.
  const { model: selectedModel } = useModel({
    modelSlug: currentModelSlug,
    mode: "image-gen"
  })

  return (
    <HeaderModelSelect
      hideAddYourOwn
      mode="image-gen"
      selectedModel={selectedModel}
      onOpenEvent={ANALYTICS_EVENTS.IMAGE_GEN_MODEL_SELECTOR_OPENED}
      onModelSelect={setCurrentModelSlug}
    />
  )
}
