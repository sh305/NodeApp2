# YoYo Voice Chat Mobile & Backend - Project Rules & Mandatory Standards

When developing any new screens, components, or backend APIs in this project (whether on this machine or after switching to another computer), ALWAYS strictly adhere to the following mandatory standards without needing the user to repeat them.

---

## 1. 📱 Mandatory Mobile Screen Guidelines (`mobile/src/screens/`)

Every mobile screen must follow these universal standards:

### A. Screen Wrapper (`ScreenContainer`)
- **Always wrap screens with `ScreenContainer`** (`import ScreenContainer from '../components/ScreenContainer'`).
- Handles SafeAreaView insets (Android 3-Button Navigation bar & iOS Home Bar/Notch overlap) automatically.
- Fixes keyboard covering inputs and handles keyboard auto-scroll + `keyboardShouldPersistTaps="handled"`.

### B. Universal Multi-Language Localization
- **NEVER hardcode raw UI strings** (Hindi, English, etc.).
- Always use `<T>Your Text Here</T>` (`import { T } from '../components/TranslatedText'`) or `const { t } = useLanguage()` (`import { useLanguage } from '../context/LanguageContext'`).
- Ensure all alerts, placeholders, and error messages use `t(...)`.

### C. Language Switcher Button
- Include `<LanguageSelectorButton variant="pill" />` or `<LanguageSelectorButton variant="icon" />` or `<LanguageSelectorButton variant="card" />` in relevant headers, landing screens, and profile/settings menus.

### D. Navigation & Safe Insets
- Import `useSafeAreaInsets` from `react-native-safe-area-context` when manual top bar padding is needed (`Math.max(16, insets.top)`).
- Handle React Navigation stack transitions and route params properly.

---

## 2. 🎨 UI & Design Aesthetics
- **Theme**: Dark glassmorphic theme (`#0F0F1A` background, `#1E1E2D` cards, `#6366F1` indigo/purple accents).
- **Smooth Polish**: Micro-animations, responsive tap feedback (`activeOpacity={0.75}`), clean typography.

---

## 3. 🌐 Backend & Database Configuration
- MongoDB Atlas configuration in `backend/src/config/db.js` with public DNS resolvers (`8.8.8.8`).
- Real-time Socket.io events for voice rooms, seats, gifts, kicks, and reports.
