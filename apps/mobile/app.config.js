export default {
  expo: {
    name: "MindPal",
    slug: "mindpal-mobile",
    scheme: "mindpal",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    platforms: ["ios", "android", "web"],
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mindpal.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.mindpal.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [],
    extra: {
      eas: {
        projectId: "your-eas-project-id-here"
      },
      // Environment variables accessible via Constants.expoConfig.extra
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001"
    }
  }
};
