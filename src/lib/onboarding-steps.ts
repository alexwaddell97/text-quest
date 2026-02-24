import type { OnbordaProps } from "onborda";

const onboardingSteps: OnbordaProps["steps"] = [
  {
    tour: "main",
    steps: [
      {
        icon: "👋",
        title: "Welcome to Roleplaying Realm",
        content:
          "Your gateway to infinite interactive fiction. This quick tour will show you around — it only takes a minute.",
        selector: "#onborda-hero",
        side: "bottom",
        showControls: true,
        pointerPadding: 12,
        pointerRadius: 16,
      },
      {
        icon: "🌍",
        title: "Browse Worlds",
        content:
          "Every card here is a fully realised setting. Click one to create a character and jump straight into a session.",
        selector: "#onborda-worlds-grid",
        side: "top",
        showControls: true,
        pointerPadding: 12,
        pointerRadius: 16,
      },
      {
        icon: "🔍",
        title: "Search Worlds",
        content:
          "Looking for something specific? Type a name or keyword to filter the worlds list in real time.",
        selector: "#onborda-search",
        side: "bottom",
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 14,
      },
      {
        icon: "🎭",
        title: "Filter by Genre",
        content:
          "Prefer fantasy over sci-fi? Use the genre dropdown to narrow down worlds to your favourite style.",
        selector: "#onborda-genre-filter",
        side: "bottom",
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 14,
      },
      {
        icon: "⚙️",
        title: "Your Account",
        content:
          "Access your profile, settings, and sign-out options from the avatar menu in the top-right corner.",
        selector: "#onborda-account",
        side: "bottom",
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 50,
      },
    ],
  },
];

export default onboardingSteps;
