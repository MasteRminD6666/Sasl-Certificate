# How to Refresh Emulator

## Quick Methods:

### 1. Keyboard Shortcuts
- **Android Emulator**: Press `R` twice quickly
- **iOS Simulator**: Press `Cmd + R` (Mac) or `Ctrl + R` (Windows)
- **In Expo Terminal**: Press `r` to reload

### 2. Developer Menu
- **Android**: Press `Ctrl + M` (Windows) or `Cmd + M` (Mac)
- **iOS**: Press `Cmd + D` (Mac) or `Ctrl + D` (Windows)
- Then select "Reload" from the menu

### 3. Shake Gesture (Physical Device)
- Shake your device to open developer menu
- Select "Reload"

### 4. Restart Dev Server
If nothing works, restart:
```bash
# Stop the current server (Ctrl + C)
# Then restart:
npm start
# or
npx expo start --clear
```

### 5. Clear Cache and Restart
```bash
npx expo start --clear
```

### 6. Full Reset (Nuclear Option)
```bash
# Clear Metro bundler cache
npx expo start --clear

# Or clear all caches
npm start -- --reset-cache

# For Android, you can also:
# 1. Close the emulator
# 2. Wipe data from AVD Manager
# 3. Restart emulator
```

### 7. Rebuild the App
```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

## Common Issues:

- **Changes not showing**: Try `r` in terminal or `Ctrl + M` → Reload
- **Stuck on splash screen**: Restart dev server with `--clear` flag
- **App crashed**: Check terminal for errors, then restart
- **Hot reload not working**: Disable and re-enable Fast Refresh in dev menu
