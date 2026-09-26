# Mandatory Mobile Screen Development Standards

Whenever creating or modifying screens/components in `mobile/`:

1. **ScreenContainer Wrapper**:
   - Wrap all screen views using `ScreenContainer` from `../components/ScreenContainer`.
   - Never leave raw Views without handling safe area insets and keyboard avoiding behavior.

2. **Localization & Language**:
   - Wrap all user-facing texts with `<T>Text</T>` from `../components/TranslatedText` or `t('Text')` from `../context/LanguageContext`.
   - Provide `<LanguageSelectorButton />` on headers and settings screens.

3. **Android Navigation Bar & iOS Home Bar**:
   - Ensure bottom insets are respected so buttons are never cut off by navigation bars.
