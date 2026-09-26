# YoYo Voice Chat Mobile & Backend - Project Rules & Mandatory Standards

When developing any new screens, components, or backend APIs in this project (whether on this machine or after switching to another computer at home or office), ALWAYS strictly adhere to the following mandatory standards without needing the user to repeat them.

---

## 1. 📱 Mandatory Multi-Language & Localization Standard (`LanguageContext` & `<T>`)

- **Rule Zero**: Regardless of whether the user prompts in Hindi, Hinglish, English, or any other language, **NEVER hardcode raw UI strings or raw error messages**.
- **Base Language is ALWAYS Pure English**: All source string keys inside `t('...')`, `<T>...</T>`, backend JSON response messages, and placeholders **MUST ALWAYS be written in standard, clean English** (e.g. `t('Match lost!')`, NOT `t('Aap match haar gaye!')`). This ensures that when the user selects English, pure English is displayed, and when Hindi/other language is chosen, the engine translates it smoothly. NEVER write Hinglish or Hindi directly into source code.
- **All Text & Labels**: Must be wrapped in `<T>Your Text</T>` (`import { T } from '../components/TranslatedText'`) or `t('Your Text')` (`import { useLanguage } from '../context/LanguageContext'`).
- **All Alerts & Toasts**: Every `Alert.alert(...)`, `showToast(...)`, and notification must pass messages through `t(...)` (e.g. `showToast(t(res.data.message || 'Fallback error message'), 'error')`).
- **All Placeholders**: Must use `placeholder={t('Enter something...')}`.
- **Language Switcher Placement (STRICT)**: **NEVER put language selector buttons or icons in screen headers (HomeScreen, VoiceRoom, or any top bar)**. Language selection belongs ONLY on the initial **Auth Screen (Login / Register footer)** and inside User Profile settings. The chosen language is stored permanently in storage and memory.
- **Auto-Sync in RAM**: Whenever adding new strings, add them to `knownPhrases` Set in `LanguageContext.js` for instant lag-free translation.

---

## 2. 🔔 Mandatory Universal Center Pop-up Toast Standard (`useToast` & `ToastContext`)

- **Rule**: NEVER show raw system browser alerts, top-clipped alerts, or custom inline toast boilerplate on individual screens.
- **Center Modal Position**: Always use the global center pop-up toast via `const { showToast } = useToast();` (`import { useToast } from '../components/Toast'`).
- **Auto-Localization**: `showToast(msg, 'success' | 'error' | 'info')` automatically routes through `t(...)` so translated text is shown in Hindi/English/etc. automatically.
- **Global Helper**: For non-React component files or Axios interceptors, use `showGlobalToast('Message', 'error')`.

---

## 3. 📱 Mandatory Screen Wrapper (`ScreenContainer`)

Every mobile screen must follow these layout rules:
- **Always wrap screens with `ScreenContainer`** (`import ScreenContainer from '../components/ScreenContainer'`).
- Handles SafeAreaView insets (Android 3-Button Navigation bar & iOS Home Bar/Notch overlap) automatically.
- Fixes keyboard covering inputs with auto-scroll and `keyboardShouldPersistTaps="handled"`.
- Use `useSafeAreaInsets` for top header padding (`Math.max(16, insets.top)`).

---

## 4. 🎨 UI & Design Aesthetics
- **Theme**: Dark glassmorphic theme (`#0F0F1A` background, `#1E1E2D` cards, `#6366F1` indigo/purple accents).
- **Interactive Touch Feedback**: Use `activeOpacity={0.75}` on touchables.
- **Micro-Animations & Smooth Polish**: Modern typography, clean badges, and polished status indicators.

---

## 5. 🌐 Backend & Database Standards
- MongoDB Atlas with `bcryptjs` password encryption and JWT token authentication.
- Real-time Socket.io events for voice rooms, seats, gifts, kicks, and reports.
- Fast OTP delivery services with Redis / RAM cache verification flags.

