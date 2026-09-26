# Mandatory Mobile & Backend Standards

Whenever creating or modifying screens, components, or API endpoints in this project:

1. **Universal Multi-Language Localization**:
   - Irrespective of the prompt language (Hindi, English, Hinglish, etc.), NEVER hardcode raw strings.
   - Wrap all UI texts, labels, and badges with `<T>Text</T>` or `t('Text')`.
   - Wrap all `showToast(...)`, `Alert.alert(...)`, placeholders, and error responses with `t(...)`.
   - Include `<LanguageSelectorButton />` on headers and menus.
   - Register new phrases in `knownPhrases` in `LanguageContext.js`.

2. **Universal Center Pop-up Toast**:
   - Always use `const { showToast } = useToast();` (`import { useToast } from '../components/Toast'`).
   - Never write repetitive local toast modal state or top-pinned alerts.
   - All toast messages automatically translate to the user's active language.

3. **ScreenContainer & Insets**:
   - Wrap screens with `ScreenContainer` to handle Android navigation bar, iOS notch, and keyboard avoiding scroll.

