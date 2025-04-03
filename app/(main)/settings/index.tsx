import { useActionSheet } from "@expo/react-native-action-sheet"
import { FlashList } from "@shopify/flash-list"
import { Link, router } from "expo-router"
import {
  AudioLinesIcon,
  AudioWaveformIcon,
  BadgePlusIcon,
  BellIcon,
  ChevronsUpDownIcon,
  FileTextIcon,
  GaugeIcon,
  Mail,
  MailIcon,
  MoonIcon,
  RefreshCwIcon,
  SunIcon,
  Ticket,
  VibrateIcon
} from "lucide-react-native"
import { useColorScheme } from "nativewind"
import { usePostHog } from "posthog-react-native"
import { type ComponentType, useCallback, useEffect, useMemo } from "react"
import { Alert, Linking, type ScrollViewProps } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import { type Address, isAddress } from "viem"
import { useEnsName } from "wagmi"

import { ActivityIndicator } from "@/components/elements/activity-indicator"
import { ExternalLink } from "@/components/elements/external-link"
import { Pressable } from "@/components/elements/pressable"
import { SelectMenu } from "@/components/elements/select-menu"
import { Switch } from "@/components/elements/switch"
import { Text } from "@/components/elements/text"
import { View } from "@/components/elements/view"
import { ModalHeader } from "@/components/layout/modal-header"
import { useInAppPurchases } from "@/components/providers/in-app-purchase-provider"
import { PushNotificationsSwitch } from "@/components/settings/push-notifications-switch"
import { useApiClient } from "@/hooks/api-client/use-api-client"
import { useAppConfig } from "@/hooks/use-app-config"
import { useAuthentication } from "@/hooks/use-authentication"
import { useSubscriptionStatus } from "@/hooks/use-subscription-status"
import { useUserPoints } from "@/hooks/use-user-points"
import {
  type ColorScheme,
  type VoiceSpeed,
  useUserSettings
} from "@/hooks/use-user-settings"
import {
  getVoiceCompositeId,
  getVoiceForCompositeId,
  usePlayVoiceSample,
  useVoiceSelections
} from "@/hooks/use-voice-selections"
import { ANALYTICS_EVENTS } from "@/lib/analytics/events"
import { appBuildVersion, appVersion } from "@/lib/constants"
import { formatAddress } from "@/lib/crypto-fns/format-address"
import { cn } from "@/lib/utils/cn"

export default function SettingsScreen() {
  const posthog = usePostHog()
  const { showActionSheetWithOptions } = useActionSheet()
  const { colorScheme: resolvedColorScheme } = useColorScheme()
  const { appConfig } = useAppConfig()

  // Subscription status
  const {
    isSubscribed,
    isLoading: isLoadingSubscriptionStatus,
    refetch
  } = useSubscriptionStatus()

  // User points
  const { isLoading: isLoadingUserPoints, data: pointsData } = useUserPoints()

  // User Settings
  const colorScheme = useUserSettings((state) => state.colorScheme)
  const setColorScheme = useUserSettings((state) => state.setColorScheme)
  const { presentPaywallIfNeeded } = useInAppPurchases()

  // available voices and voice selection for TTS
  const voice = useUserSettings((state) => state.voice)
  const setVoice = useUserSettings((state) => state.setVoice)
  const playVoiceSample = usePlayVoiceSample()
  const { availableVoices, voiceSelectorOptions } = useVoiceSelections()

  const voiceChatHandsFree = useUserSettings(
    (state) => state.voiceChatHandsFree
  )
  const setVoiceChatHandsFree = useUserSettings(
    (state) => state.setVoiceChatHandsFree
  )

  const voiceSpeed = useUserSettings((state) => state.voiceSpeed)
  const setVoiceSpeed = useUserSettings((state) => state.setVoiceSpeed)

  const hapticsEnabled = useUserSettings((state) => state.hapticsEnabled)
  const setHapticsEnabled = useUserSettings((state) => state.setHapticsEnabled)

  const resetUserSettings = useUserSettings((state) => state.reset)

  const { signOut, user } = useAuthentication()
  const apiClient = useApiClient()

  const { data: ensName } = useEnsName({
    address: user?.name as Address,
    query: {
      enabled: isAddress(user?.name ?? "")
    }
  })

  const appVersionString = `v${appVersion} (${appBuildVersion})`

  const showDeleteAccountActionSheet = useCallback(() => {
    showActionSheetWithOptions(
      {
        title: "Are you sure?",
        message:
          "All of your data will be erased. This action can not be undone",
        options: ["Cancel", "Delete Account"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1
      },
      (index) => {
        if (index === 1) {
          try {
            void apiClient.fetch("/api/mobile/users", {
              method: "DELETE"
            })
          } catch (e) {
            // noop
          }

          signOut()
        }
      }
    )
  }, [apiClient, showActionSheetWithOptions, signOut])

  // Upon mount, ensure we have the latest subscription status
  useEffect(() => {
    void refetch()
  }, [refetch])

  const accessSection = useMemo(
    () => (
      <View className="gap-3">
        <Text className="text-muted-foreground">Account</Text>

        <View>
          <View className="flex-row items-center justify-between gap-2 rounded-t-xl border-x border-t border-border p-3">
            <View className="flex-row items-center gap-2">
              <Mail className="text-primary" size={20} />
              <Text>Email</Text>
            </View>
            <Text className="line-clamp-1 shrink text-muted-foreground">
              {user
                ? isAddress(user.name)
                  ? ensName
                    ? ensName
                    : formatAddress(user.name)
                  : (user.email ?? user.name)
                : null}
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-2 border-x border-t border-border p-3">
            <View className="flex-row items-center gap-2">
              <Ticket className="text-primary" size={20} />
              <Text>Subscription</Text>
            </View>
            <View>
              {isSubscribed ? (
                <Text className="basis-1/3 text-muted-foreground">
                  Subscribed
                </Text>
              ) : !isLoadingSubscriptionStatus ? (
                <Link href="/settings/access-info">
                  <Text className="basis-1/3 text-muted-foreground">
                    Free plan
                  </Text>
                </Link>
              ) : null}
            </View>
          </View>
          {!isSubscribed ? (
            <View className="border-x border-border p-3">
              <Pressable
                analyticsEvent="upgrade_to_pro_pressed"
                onPress={async () => await presentPaywallIfNeeded()}
              >
                <Text variant="bold" className="text-primary">
                  Upgrade to Decent Pro
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Points */}
          <View
            className={cn(
              "flex-row items-center gap-2 border-x border-t border-border p-3",
              appConfig?.urls?.points ? "" : "rounded-b-xl border-b"
            )}
          >
            <>
              <BadgePlusIcon className="text-primary" size={20} />
              <Text className="grow text-foreground">Your points</Text>
            </>
            {isLoadingUserPoints ? (
              <ActivityIndicator color="#AAAAAA" size={20} />
            ) : (
              <Text className="text-muted-foreground">
                {pointsData?.points != null ? pointsData.points : "-"}
              </Text>
            )}
          </View>

          {appConfig?.urls?.points ? (
            <View className="rounded-b-xl border-x border-b border-border p-3">
              <ExternalLink
                href={appConfig.urls.points}
                onPress={() => {
                  posthog.capture(ANALYTICS_EVENTS.POINTS_LEARN_MORE_PRESSED)
                }}
              >
                <Text variant="bold" className="text-primary">
                  Learn more
                </Text>
              </ExternalLink>
            </View>
          ) : null}
        </View>
      </View>
    ),
    [
      appConfig,
      ensName,
      isLoadingSubscriptionStatus,
      isLoadingUserPoints,
      isSubscribed,
      pointsData,
      posthog,
      presentPaywallIfNeeded,
      user
    ]
  )

  const appInfoSection = useMemo(
    () => (
      <View className="gap-3">
        <Text className="text-muted-foreground">App</Text>
        <View>
          <View className="flex-row items-center gap-2 rounded-t-xl border-x border-t border-border p-3">
            <AudioLinesIcon className="text-primary" size={20} />
            <Text className="grow text-foreground">Voice</Text>
            <SelectMenu
              className="flex-row items-center gap-1"
              onSelect={(compositeId: string) => {
                posthog.capture(ANALYTICS_EVENTS.VOICE_CHANGED, {
                  voice: compositeId
                })
                if (availableVoices) {
                  const selectedVoice = getVoiceForCompositeId(
                    compositeId,
                    availableVoices
                  )
                  if (selectedVoice) {
                    setVoice(selectedVoice)
                    void playVoiceSample(selectedVoice)
                  }
                }
              }}
              options={voiceSelectorOptions ?? []}
              value={getVoiceCompositeId(voice)}
            >
              <Text>{voice.name}</Text>
              <ChevronsUpDownIcon
                className="text-secondary-foreground"
                size={20}
              />
            </SelectMenu>
          </View>

          <View className="flex-row items-center gap-2 border-x border-t border-border p-3">
            <AudioWaveformIcon className="text-primary" size={20} />
            <Text className="grow text-base text-foreground">
              Hands-Free Voice Chat
            </Text>
            <Switch
              onValueChange={(newValue) => {
                posthog.capture(
                  ANALYTICS_EVENTS.VOICE_CHAT_HANDS_FREE_CHANGED,
                  {
                    voiceHandsFree: newValue
                  }
                )
                setVoiceChatHandsFree(newValue)
              }}
              value={voiceChatHandsFree}
            />
          </View>

          <View className="flex-row items-center gap-2 border-x border-t border-border p-3">
            <GaugeIcon className="text-primary" size={20} />
            <Text className="grow text-base text-foreground">
              Voice Playback Speed
            </Text>
            <SelectMenu
              className="flex-row items-center gap-1"
              onSelect={(id: VoiceSpeed) => {
                posthog.capture(ANALYTICS_EVENTS.VOICE_SPEED_CHANGED, {
                  voiceSpeed: id
                })
                setVoiceSpeed(id)
              }}
              options={[
                { id: "slowest", title: "Slowest" },
                { id: "slow", title: "Slow" },
                { id: "normal", title: "Normal" },
                { id: "fast", title: "Fast" },
                { id: "fastest", title: "Fastest" }
              ]}
              value={voiceSpeed}
            >
              <Text style={{ textTransform: "capitalize" }}>{voiceSpeed}</Text>
              <ChevronsUpDownIcon
                className="text-secondary-foreground"
                size={20}
              />
            </SelectMenu>
          </View>

          <View className="flex-row items-center gap-2 border-x border-t border-border p-3">
            <VibrateIcon className="text-primary" size={20} />
            <Text className="grow text-foreground">Haptic feedback</Text>
            <Switch
              analyticsEvent={(value) =>
                `haptics_${value ? "enabled" : "disabled"}`
              }
              onValueChange={(newValue) => {
                setHapticsEnabled(newValue)
              }}
              value={hapticsEnabled}
            />
          </View>

          <View className="flex-row items-center gap-2 border-x border-t border-border p-3">
            <BellIcon className="text-primary" size={20} />
            <Pressable
              className="grow text-foreground"
              onLongPress={() => {
                posthog.capture(
                  ANALYTICS_EVENTS.ADVANCED_NOTIFICATION_SETTINGS_OPENED
                )
                router.push("/(main)/settings/push-notifications/debug")
              }}
            >
              <Text className="text-foreground">Push notifications</Text>
            </Pressable>
            <PushNotificationsSwitch />
          </View>

          <View className="flex-row items-center gap-2 border-x border-t border-border p-3">
            {resolvedColorScheme === "dark" ? (
              <MoonIcon className="text-primary" size={20} />
            ) : (
              <SunIcon className="text-primary" size={20} />
            )}
            <Text className="grow text-foreground">Color scheme</Text>
            <SelectMenu
              className="flex-row items-center gap-1"
              onSelect={(id: ColorScheme) => {
                posthog.capture(ANALYTICS_EVENTS.COLOR_SCHEME_CHANGED, {
                  color_scheme: id
                })
                setColorScheme(id)
              }}
              options={[
                { id: "system", title: "System" },
                { id: "dark", title: "Dark" },
                { id: "light", title: "Light" }
              ]}
              value={colorScheme}
            >
              <Text style={{ textTransform: "capitalize" }}>{colorScheme}</Text>
              <ChevronsUpDownIcon
                className="text-secondary-foreground"
                size={20}
              />
            </SelectMenu>
          </View>

          <Pressable
            className="flex-row items-center gap-2 rounded-b-xl border border-border p-3"
            onPress={() => {
              Alert.alert(
                "Reset to default settings",
                "Are you sure you want reset your settings to the defaults?",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: "Reset",
                    onPress: () => {
                      resetUserSettings()
                      posthog.capture(ANALYTICS_EVENTS.SETTINGS_RESET)
                    }
                  }
                ]
              )
            }}
          >
            <RefreshCwIcon className="text-primary" size={20} />
            <Text className="grow text-foreground">
              Reset to default settings
            </Text>
          </Pressable>
        </View>
      </View>
    ),
    [
      availableVoices,
      colorScheme,
      hapticsEnabled,
      playVoiceSample,
      posthog,
      resetUserSettings,
      resolvedColorScheme,
      setColorScheme,
      setHapticsEnabled,
      setVoice,
      setVoiceChatHandsFree,
      setVoiceSpeed,
      voice,
      voiceChatHandsFree,
      voiceSelectorOptions,
      voiceSpeed
    ]
  )

  const myAccountSection = useMemo(
    () => (
      <View>
        <Pressable
          className="flex-row items-center gap-2 rounded-xl border border-border p-3"
          onPress={() => {
            Alert.alert("Sign out", "Are you sure you want to sign out?", [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "Sign out",
                style: "destructive",
                onPress: () => {
                  posthog.capture(ANALYTICS_EVENTS.USER_SIGNED_OUT)
                  signOut()
                }
              }
            ])
          }}
        >
          <Text variant="medium" className="grow text-primary">
            Sign out
          </Text>
        </Pressable>
      </View>
    ),
    [posthog, signOut]
  )

  const closeAccountSection = useMemo(
    () => (
      <View>
        <Pressable
          className="flex-row items-center gap-2 rounded-xl border border-border p-3"
          onPress={() => {
            showDeleteAccountActionSheet()
          }}
        >
          <Text className="grow text-destructive">Delete account</Text>
        </Pressable>
      </View>
    ),
    [showDeleteAccountActionSheet]
  )

  const moreSection = useMemo(
    () => (
      <View className="gap-3">
        <Text className="text-muted-foreground">About</Text>
        <View>
          <Pressable
            analyticsEvent="contact_email_opened"
            className="flex-row items-center gap-2 rounded-t-xl border-x border-t border-border p-3"
            onPress={async () => {
              const supportEmail = "feedback@decentai.app"
              const subject = encodeURIComponent("DecentAI Feedback")
              const body = encodeURIComponent(
                `\n\nApp Version: ${appVersionString}`
              )
              const url = `mailto:${supportEmail}?subject=${subject}&body=${body}`

              const canOpenURL = await Linking.canOpenURL(url)
              if (!canOpenURL) {
                Alert.alert(
                  "Unable to find mail app",
                  `You can contact us at:\n${supportEmail}`
                )

                return
              }

              return Linking.openURL(url)
            }}
          >
            <MailIcon className="text-primary" size={20} />
            <Text className="grow text-foreground">Contact</Text>
          </Pressable>

          <ExternalLink asChild href="https://decentai.app/privacy">
            <Pressable
              analyticsEvent="privacy_policy_opened"
              className="flex-row items-center gap-2 rounded-b-xl border border-border p-3"
            >
              <FileTextIcon className="text-primary" size={20} />
              <Text className="grow text-foreground">Privacy policy</Text>
            </Pressable>
          </ExternalLink>
        </View>
      </View>
    ),
    [appVersionString]
  )

  const metadataSection = useMemo(
    () => (
      <View className="items-center gap-4">
        <Text className="text-muted-foreground">
          This experimental software makes mistakes and may produce inaccurate
          information.
        </Text>

        <Text variant="mono" className="text-xs text-muted-foreground">
          {appVersionString}
        </Text>
      </View>
    ),
    [appVersionString]
  )

  return (
    <View className="size-full bg-background">
      <ModalHeader />
      <FlashList
        renderScrollComponent={ScrollView as ComponentType<ScrollViewProps>}
        contentContainerStyle={{ padding: 20 }}
        data={[
          accessSection,
          appInfoSection,
          moreSection,
          myAccountSection,
          closeAccountSection,
          metadataSection
        ]}
        estimatedItemSize={150}
        keyExtractor={(_item, index) => index.toString()}
        renderItem={({ item }) => <View className="mb-7">{item}</View>}
      />
    </View>
  )
}
