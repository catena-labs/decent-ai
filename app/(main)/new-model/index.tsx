import { useLocalSearchParams, useRouter } from "expo-router"
import { usePostHog } from "posthog-react-native"
import { useCallback, useMemo, useState } from "react"
import { Alert, KeyboardAvoidingView, ScrollView } from "react-native"
import Toast from "react-native-toast-message"

import { Pressable } from "@/components/elements/pressable"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { CustomModelTestButton } from "@/components/models/custom-model/custom-model-test-button"
import { NewModelInputField } from "@/components/models/custom-model/new-model-input-field"
import { useCustomModelStore } from "@/hooks/custom-models/use-custom-model-store"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { isAndroid } from "@/lib/utils/platform"

type SearchParams = {
  id: string
}

export default function NewModelScreen() {
  const { id } = useLocalSearchParams<SearchParams>()

  const router = useRouter()
  const posthog = usePostHog()

  const { addModel, deleteModel, models, updateModel } = useCustomModelStore()

  const model = useMemo(() => models.find((m) => m.id === id), [id, models])

  const [baseURL, setBaseURL] = useState(model?.baseURL ?? "")
  const [apiKey, setApiKey] = useState(model?.apiKey ?? "")
  const [modelSlug, setModelSlug] = useState(model?.modelSlug ?? "")
  const [name, setName] = useState(model?.name ?? "")
  const isEditing = useMemo(() => Boolean(model), [model])

  const [isTestSuccessful, setIsTestSuccessful] = useState(false)

  /**
   * Require testing before saving. When editing, we don't need to test again.
   */
  const canSave = useMemo(
    () => isEditing || (baseURL && modelSlug && isTestSuccessful),
    [baseURL, isTestSuccessful, modelSlug, isEditing]
  )

  const goBack = useCallback(() => {
    if (router.canDismiss()) {
      router.dismiss()
    } else if (router.canGoBack()) {
      router.back()
    } else {
      router.push("/(main)")
    }
  }, [router])

  const onSave = useCallback(() => {
    if (!canSave) {
      return
    }

    if (model) {
      posthog.capture(ANALYTICS_EVENTS.UPDATE_CUSTOM_MODEL)
      updateModel({ id: model.id, baseURL, apiKey, modelSlug, name })
      Toast.show({
        type: "success",
        text1: "Custom model updated!"
      })
    } else {
      posthog.capture(ANALYTICS_EVENTS.CREATE_CUSTOM_MODEL)
      addModel({
        baseURL,
        apiKey,
        modelSlug,
        name
      })

      Toast.show({
        type: "success",
        text1: "Custom model saved!"
      })
    }

    goBack()
  }, [
    addModel,
    apiKey,
    baseURL,
    canSave,
    goBack,
    model,
    modelSlug,
    posthog,
    name,
    updateModel
  ])

  const onDelete = useCallback(() => {
    Alert.alert("Delete", "Are you sure you want to delete this model?", [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Yes, delete",
        style: "destructive",
        onPress: () => {
          posthog.capture(ANALYTICS_EVENTS.DELETE_CUSTOM_MODEL)
          deleteModel(model?.id)
          goBack()
        }
      }
    ])
  }, [goBack, deleteModel, posthog, model])

  return (
    <View
      className="flex size-full flex-col bg-background"
      safeArea={isAndroid ? true : "bottom"}
    >
      {/* Header */}
      <View
        className="w-full flex-row items-center justify-between rounded-t-lg bg-background p-5"
        style={{
          height: 60
        }}
      >
        <Pressable
          className="flex-1 items-start justify-center"
          style={{
            height: 60
          }}
          onPress={() => {
            if (router.canGoBack()) {
              router.back()
            } else {
              router.navigate({
                pathname: "/(main)"
              })
            }
          }}
        >
          <Text className="text-sm">Cancel</Text>
        </Pressable>

        {canSave ? (
          <Pressable
            className="flex-1 items-end justify-center"
            style={{
              height: 60
            }}
            disabled={!canSave}
            onPress={onSave}
          >
            <Text variant="bold" className="text-sm">
              Save
            </Text>
          </Pressable>
        ) : (
          <View className="flex-1" />
        )}
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
        keyboardVerticalOffset={80}
      >
        <ScrollView
          className="flex h-full flex-1 flex-col bg-background p-5 pb-0"
          contentContainerClassName="pb-10"
        >
          <View className="flex-1 grow gap-4">
            <Text variant="medium" className="text-xl">
              Add your own model
            </Text>

            <NewModelInputField
              name="Name"
              description="Add a name for your model"
              value={name}
              setValue={setName}
            />

            <NewModelInputField
              name="Base URL"
              description="URL format should be compatible with a chat completion endpoint ending in /v1/"
              value={baseURL}
              setValue={setBaseURL}
              inputMode="url"
            />
            <NewModelInputField
              name="API Key"
              description="Optional. API key is only stored on-device, encrypted."
              value={apiKey}
              setValue={setApiKey}
              secureTextEntry
            />
            <NewModelInputField
              name="Model"
              description="Specify a model to use."
              value={modelSlug}
              setValue={setModelSlug}
            />

            <CustomModelTestButton
              apiKey={apiKey}
              baseURL={baseURL}
              modelSlug={modelSlug}
              onTestResult={(isSuccess) => {
                setIsTestSuccessful(isSuccess)
              }}
            />
          </View>

          {isEditing ? (
            <Pressable
              className="h-12 items-center justify-center rounded-xl bg-card py-4"
              onPress={onDelete}
            >
              <Text
                variant="bold"
                className="text-[17px] leading-[18px] text-destructive"
              >
                Delete Model
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
