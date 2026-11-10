# HeatMaps desktop builds

HeatMaps uses Tauri 2 to package the audited static Next.js application as a native desktop application for Windows, macOS, and Linux. The desktop app has no cloud backend: habits, streaks, journals, reviews, preferences, and custom audio remain in that operating system's WebView storage.

## Commands

```bash
npm install
npm run tauri:dev
npm run tauri:build
```

`tauri:build` first runs `npm run build:native`, then packages the resulting `out/` directory. It never starts a web server or sends user data to one.

## Platform release gates

- **Linux:** build on the target Linux distribution with Cargo and the WebKitGTK development packages installed. Produce and test the AppImage and/or `.deb` on a clean user account.
- **Windows:** build on Windows with the Microsoft C++ Build Tools and WebView2 Runtime installed. Sign the installer with the production code-signing certificate.
- **macOS:** build on macOS with Xcode and Apple Developer signing. Notarize the `.app`/DMG before distribution.

The desktop bundle identifier is `com.heatmaps.desktop`. Desktop app storage is isolated from the web browser and mobile app. Export a HeatMaps backup before uninstalling, clearing app data, or moving to another device. Custom uploaded audio remains local IndexedDB data and is intentionally excluded from the JSON backup.
