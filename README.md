<div align="center">

```
██████╗  ██████╗ ██╗     ███████╗██████╗ ██╗      █████╗ ██╗   ██╗██╗███╗   ██╗ ██████╗
██╔══██╗██╔═══██╗██║     ██╔════╝██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝██║████╗  ██║██╔════╝
██████╔╝██║   ██║██║     █████╗  ██████╔╝██║     ███████║ ╚████╔╝ ██║██╔██╗ ██║██║  ███╗
██╔══██╗██║   ██║██║     ██╔══╝  ██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ██║██║╚██╗██║██║   ██║
██║  ██║╚██████╔╝███████╗███████╗██║     ███████╗██║  ██║   ██║   ██║██║ ╚████║╚██████╔╝
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝

██████╗ ███████╗ █████╗ ██╗     ███╗   ███╗
██╔══██╗██╔════╝██╔══██╗██║     ████╗ ████║
██████╔╝█████╗  ███████║██║     ██╔████╔██║
██╔══██╗██╔══╝  ██╔══██║██║     ██║╚██╔╝██║
██║  ██║███████╗██║  ██║███████╗██║ ╚═╝ ██║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝
```

### *An AI-powered, setting-agnostic text adventure platform*

![Version](https://img.shields.io/badge/version-0.5.0-blueviolet?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss)
![MongoDB](https://img.shields.io/badge/MongoDB-6-47a248?style=flat-square&logo=mongodb)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

---

## What is Roleplaying Realm?

**Roleplaying Realm** is a text-based adventure game platform powered by the Claude & GPT APIs. Enter hand-crafted worlds or your own custom setting, build a character, and let the AI weave a dynamic story around every choice you make. No two playthroughs are the same.

---

## Features

| Feature | Description |
|---|---|
| **Multiple Worlds** | Pre-built settings: WoW, Elder Scrolls, Fallout, Cyberpunk — or bring your own |
| **AI Storytelling** | Claude & GPT APIs drive real-time, context-aware narrative generation |
| **Character System** | Create and manage characters with inventories and persistent state |
| **Setting Effects** | Each world has unique visual and gameplay effects |
| **Onboarding Tour** | First-time player guidance built in |
| **Dark Mode** | Night mode toggle for late-night questing |
| **Authentication** | Secure login via NextAuth |
| **Cloud Storage** | Save state and assets via Vercel Blob |

---

## Tech Stack

```
Frontend          Next.js 14 · React 18 · TypeScript 5
Styling           Tailwind CSS · DaisyUI · Framer Motion
AI / LLM          Anthropic Claude SDK · OpenAI SDK
Database          MongoDB 6
Auth              NextAuth 4
Storage           Vercel Blob
Icons             Lucide React
Markdown          Marked · Marked-React
Onboarding        Onborda
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)
- An Anthropic API key and/or OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/roleplaying-realm.git
cd roleplaying-realm

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
MONGODB_URI=your_mongodb_connection_string

ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Scripts

Seed and patch scripts are provided for initial data setup:

```bash
# Seed world themes
npm run seed:themes

# Seed game settings
npm run seed:settings

# Migration & patch scripts
npm run migrate:genres
npm run patch:wow-theme
npm run patch:elder-scrolls
npm run patch:fallout
npm run patch:cyberpunk
```

---

## Project Structure

```
src/
├── app/                   # Next.js app router pages
│   ├── play/              # Core game screen
│   ├── account/           # User account management
│   ├── how-it-works/      # Feature walkthrough page
│   ├── login/             # Auth pages
│   └── api/               # API routes (AI, auth, game state)
├── components/            # Reusable UI components
│   ├── GameScreen/        # Main game interface
│   ├── SettingCard/       # World/theme selection cards
│   ├── SettingEffect/     # Per-setting visual effects
│   ├── Modal/             # Dialog components
│   ├── OnboardingTour/    # First-time user flow
│   └── ...
├── lib/                   # Database clients & utilities
├── types/                 # TypeScript type definitions
├── utils/                 # Shared helper functions
└── context/               # React context providers
scripts/                   # DB seed & migration scripts
```

---

## Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m 'Add your feature'`
4. Push to the branch — `git push origin feature/your-feature`
5. Open a pull request

---

## Deployment

The easiest way to deploy is via [Vercel](https://vercel.com/new). Connect your repository, add your environment variables in the Vercel dashboard, and deploy.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with Next.js · Powered by Claude & GPT · Deployed on Vercel

</div>
