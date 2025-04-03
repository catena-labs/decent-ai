export const ANALYTICS_EVENTS = {
  /**
   * Chat view
   */
  AI_CHAT_FEEDBACK: "ai_chat_feedback",
  AI_CHAT_FEEDBACK_TERMS_ACCEPTED: "ai_chat_feedback_terms_accepted",
  AI_CHAT_FEEDBACK_TERMS_REJECTED: "ai_chat_feedback_terms_rejected",
  CAMERA_UPLOAD_SELECTED: "camera_upload_selected",
  CHAT_AUDIO_MODE_STARTED: "chat_audio_mode_started",
  CHAT_CONVERSATION_DELETED: "chat_conversation_deleted",
  CHAT_INPUT_FOCUSED: "chat_input_focused",
  CHAT_MESSAGE_INTERRUPTED: "chat_message_interrupted",
  CHAT_MESSAGE_SENT: "chat_message_sent",
  CHAT_MODEL_SELECTOR_OPENED: "chat_model_selector_opened",
  CHAT_OVERFLOW_MENU_OPENED: "chat_overflow_menu_opened",
  CHAT_UPLOAD_BUTTON_PRESSED: "chat_upload_button_pressed",
  MESSAGE_COPIED: "message_copied",
  MESSAGE_REGENERATED: "message_regenerated",
  PHOTO_GALLERY_UPLOAD_SELECTED: "photo_gallery_upload_selected",
  STT_INITIATED: "stt_initiated",
  STT_STOPPED: "stt_stopped",
  UPLOAD_IMAGE_CANCEL_PRESSED: "upload_image_cancel_pressed",
  QUICK_ACTION_PRESSED: "quick_action_pressed",

  /**
   * Audio mode
   */
  AUDIO_MODE_EXITED: "audio_mode_exited",
  AUDIO_MODE_RECORDING_STARTED: "audio_mode_recording_started",
  SPEECH_TO_TEXT: "speech_to_text",

  /**
   * Image Gen
   */
  IMAGE_GALLERY_DELETE_ALL_IMAGES: "image_gallery_delete_all_images",
  IMAGE_GALLERY_OPENED: "image_gallery_opened",
  IMAGE_GALLERY_IMAGE_OPENED: "image_gallery_image_opened",
  IMAGE_GALLERY_OVERFLOW_MENU_OPENED: "image_gallery_overflow_menu_opened",
  IMAGE_GALLERY_NEW_IMAGE: "image_gallery_new_image",
  IMAGE_GEN_ASPECT_RATIO_CHANGED: "image_gen_aspect_ratio_changed",
  IMAGE_GEN_DELETE_IMAGE: "image_gen_delete_image",
  IMAGE_GEN_FLAG_IMAGE: "image_gen_flag_image",
  IMAGE_GEN_MODEL_SELECTOR_OPENED: "image_gen_model_selector_opened",
  IMAGE_GEN_PROMPT_CLEARED: "image_gen_prompt_cleared",
  IMAGE_GEN_PROMPT_SUBMITTED: "image_gen_prompt_submitted",
  IMAGE_GEN_SHARE_IMAGE: "image_gen_share_image",

  /**
   * Drawer
   */
  CONVERSATION_OPENED: "conversation_opened",
  CONVERSATION_RENAMED: "conversation_renamed",
  CONVERSATION_HISTORY_DELETED: "conversation_history_deleted",
  DRAWER_OVERFLOW_MENU_OPENED: "drawer_overflow_menu_opened",
  DRAWER_CONVERSATION_DELETED: "home_screen_conversation_deleted",
  DRAWER_QUICK_ACTION_PRESSED: "drawer_quick_action_pressed",

  /**
   * Settings
   */
  ADVANCED_NOTIFICATION_SETTINGS_OPENED:
    "advanced_notification_settings_opened",
  COLOR_SCHEME_CHANGED: "color_scheme_changed",
  CONTACT_EMAIL_OPENED: "contact_email_opened",
  HAPTICS_DISABLED: "haptics_disabled",
  HAPTICS_ENABLED: "haptics_enabled",
  POINTS_LEARN_MORE_PRESSED: "points_learn_more_pressed",
  PRIVACY_POLICY_OPENED: "privacy_policy_opened",
  PUSH_NOTIFICATIONS_DISABLED: "push_notifications_disabled",
  PUSH_NOTIFICATIONS_ENABLED: "push_notifications_enabled",
  SETTINGS_OPENED: "settings_opened",
  SETTINGS_RESET: "settings_reset",
  TERMS_OF_SERVICE_OPENED: "terms_of_service_opened",
  UPGRADE_TO_PRO_PRESSED: "upgrade_to_pro_pressed",
  VOICE_CHANGED: "voice_changed",
  VOICE_SPEED_CHANGED: "voice_speed_changed",
  VOICE_CHAT_HANDS_FREE_CHANGED: "voice_chat_hands_free_changed",
  VOICE_CHAT_CAPTIONS_CHANGED: "voice_chat_captions_changed",

  /**
   * Model select modal
   */
  CREATE_ROUTER_MIX_PRESSED: "create_router_mix_pressed",
  CUSTOMIZE_MODEL_PRESSED: "customize_model_pressed",
  MODEL_INFO_PRESSED: "model_info_pressed",
  MODEL_SELECTED: "model_selected",
  ROUTER_SELECTED: "router_selected",
  PAYWALLED_MODEL_SELECTED: "paywalled_model_selected",
  PAYWALLED_ROUTER_SELECTED: "paywalled_router_selected",

  /**
   * System prompt modal
   */
  SYSTEM_PROMPT_EDIT_CANCELLED: "system_prompt_edit_cancelled",
  SYSTEM_PROMPT_EDIT_SAVED: "system_prompt_edit_saved",

  /**
   * Rate limit hit
   */
  RATE_LIMIT_HIT: "rate_limit_hit",

  /**
   * General
   */
  FULL_ACCESS_OPENED: "full_access_opened",
  TOAST_DISMISSED: "toast_dismissed",
  USER_SIGNED_IN: "user_signed_in",
  USER_SIGNED_OUT: "user_signed_out",

  /**
   * BYOM
   */
  TEST_CUSTOM_MODEL: "test_custom_model",
  TEST_CUSTOM_MODEL_SUCCESS: "test_custom_model_success",
  TEST_CUSTOM_MODEL_FAILURE: "test_custom_model_failure",
  CREATE_CUSTOM_MODEL: "create_custom_model",
  DELETE_CUSTOM_MODEL: "delete_custom_model",
  UPDATE_CUSTOM_MODEL: "update_custom_model",

  /**
   * Paywall
   */
  PAYWALL_RESULT_NOT_PRESENTED: "paywall_result_not_presented",
  PAYWALL_RESULT_ERROR: "paywall_result_error",
  PAYWALL_RESULT_CANCELLED: "paywall_result_cancelled",
  PAYWALL_RESULT_PURCHASED: "paywall_result_purchased",
  PAYWALL_RESULT_RESTORED: "paywall_result_restored"
} as const

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]
