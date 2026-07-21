# Wordle 2.2 - German Edition

A modern German implementation of the popular Wordle game. This project is originally forked from [woertchen](https://github.com/diondiondion/woertchen) and features a curated German word list with enhanced accessibility and universal keyboard support.

## Features

- **Curated German Words** - High-quality word list
- **Universal Keyboard Support** - Standard A-Z layout works on any keyboard (no special characters required)
- **Cursor-based editing** - Tap any letter in the current row to change it
- **Modern React UI** - Built with Vite, React 18, TypeScript, and Tailwind CSS 4
- **Progressive Web App** - Install and play offline; tuned for a native-app feel on iOS/Android home screens (status bar, splash, no tap-highlight flash)
- **Dark Mode & High-Contrast Mode** - Comfortable gameplay in any lighting, plus a colorblind-friendly palette
- **Hard Mode** - Optional challenge mode that enforces reusing revealed hints
- **Haptic Feedback** - Subtle vibration on key actions (skipped under reduced-motion)
- **Statistics Tracking** - Track your progress and winning streaks
- **Daily Leaderboard (optional)** - Passphrase-gated comparison with anyone else who knows it; self-hosted, no accounts, fails silently if not deployed — see [Daily Leaderboard](#daily-leaderboard-optional)
- **Share Results** - Native share or clipboard, with a spoiler variant for close friends
- **Mobile-first Design** - Optimized for one-handed phone play

## Quick Start

### Run Locally

Clone the repository and start the development server:

```bash
git clone <repository-url>
cd wordle
npm install
npm run dev
```

The app will open at [http://localhost:5173](http://localhost:5173)

### Build for Production

Create an optimized production build:

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Docker Support

#### Docker Compose (Recommended for Production)

The easiest way to deploy in production:

```bash
# Quick start
docker-compose -f docker-compose.prod.yml up -d

# With custom configuration
cp .env.docker.example .env.docker
# Edit .env.docker with your settings
docker-compose --env-file .env.docker -f docker-compose.prod.yml up -d

# Or use the Makefile for easier management
make up-prod
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

`docker-compose.prod.yml` also includes an optional `leaderboard-api` service for the daily leaderboard (set `LEADERBOARD_PASSPHRASE` in `.env.docker` to enable it — see [Daily Leaderboard](#daily-leaderboard-optional)). Omit it and the app works identically without a leaderboard.

For detailed Docker Compose documentation including SSL/TLS setup, monitoring, and troubleshooting, see [DOCKER.md](DOCKER.md).

##### Using the Makefile

For simplified Docker management, use the included Makefile:

```bash
make help         # Show all available commands
make build-prod   # Build production image
make up-prod      # Start production container
make logs-prod    # View logs
make health       # Check container health
make down-prod    # Stop container
```

#### Standalone Docker Containers

##### Development Container

```bash
docker build -t wordle:dev .
docker run -d -p 3000:3000 wordle:dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

##### Production Container

```bash
docker build --target=prod -t wordle:prod .
docker run -d -p 8080:8080 wordle:prod
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## Word Lists

This project uses carefully curated German word lists:

- **Solution Words**: 882 five-letter German words (provides ~2.4 years of daily puzzles)
- **Valid Guesses**: 2,411 accepted words for gameplay
- **Character Set**: A-Z only (no umlauts for universal compatibility)
- **Quality**: Zero duplicates, zero invalid entries, 100% coverage

## Technology Stack

- **Frontend**: React 18 with TypeScript 5
- **Styling**: Tailwind CSS 4 with a nature-inspired design system
- **UI Components**: Headless UI for accessible modals
- **Icons**: Heroicons
- **Build Tool**: Vite 6 with vite-plugin-pwa
- **Testing**: Vitest and React Testing Library
- **Code Quality**: Prettier, Husky pre-commit hooks
- **Motion**: Framer Motion
- **Leaderboard backend** (optional, `server/`): Fastify + better-sqlite3

## Project Structure

```
wordle/
├── public/           # Static assets and PWA icons
├── src/
│   ├── components/   # React components
│   │   ├── alerts/   # Alert notifications
│   │   ├── grid/     # Game grid and cells
│   │   ├── keyboard/ # Virtual keyboard
│   │   ├── modals/   # Info, Settings, Stats modals
│   │   └── stats/    # Statistics, progress tracking, and the leaderboard
│   ├── constants/    # Game settings and word lists
│   ├── context/      # React context providers
│   ├── hooks/        # useGameState, useTheme, useWordOfDay
│   └── lib/          # Utility functions
├── docker/           # Docker / nginx configuration
├── server/           # Optional Fastify + SQLite leaderboard API
└── .github/          # GitHub Actions workflows
```

## Customization

### Change Word Length

To modify the game to use words of a different length:

1. Update `MAX_WORD_LENGTH` in [src/constants/settings.ts](src/constants/settings.ts)
2. Replace the words in [src/constants/wordlist.ts](src/constants/wordlist.ts) with words of the new length
3. Update [src/constants/validGuesses.ts](src/constants/validGuesses.ts) with valid guesses of the new length

## Development Scripts

```bash
npm run dev        # Start Vite development server
npm start          # Alias for npm run dev
npm run build      # Build for production → dist/
npm run preview    # Preview production build
npm test           # Run Vitest once
npm run test:watch # Vitest watch mode
npm run lint       # Check code formatting
npm run fix        # Auto-fix formatting issues
```

## Game Settings

- **Word Length**: 5 letters
- **Max Attempts**: 6 guesses
- **Character Set**: A-Z (26 letters)
- **Daily Puzzle**: New word every day
- **Hard Mode**: Optional challenge mode

## Daily Leaderboard (optional)

The Stats modal can show a daily leaderboard of everyone who knows a shared passphrase — no accounts, no sign-up. It's powered by a small, optional service in [server/](server/) and works like this:

- **Join**: enter any name plus the shared passphrase, once per device (cached in `localStorage`).
- **Submit**: your result posts automatically when a game ends — no extra step.
- **Reveal is gated**: you see who's played and their guess count right away, but full guess grids only unlock once you've finished today's word yourself — so opening Stats mid-game can't spoil anything.
- **Fails silently**: if the backend isn't deployed, isn't reachable, or you never set up a name, the game is completely unaffected — the leaderboard section just doesn't show anything.

Enabling it requires deploying `server/` alongside the app and setting a `LEADERBOARD_PASSPHRASE`. See [DOCKER.md → Leaderboard API](DOCKER.md#leaderboard-api-optional) for the full setup (Docker Compose service, Traefik/Portainer wiring, backups) and local dev instructions.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please ensure:

1. Code passes all linting checks (`npm run lint`)
2. All tests pass (`npm test`)
3. Husky pre-commit hooks pass
4. Changes are well-documented

## License

See [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original project: [woertchen](https://github.com/diondiondion/woertchen) by diondiondion
- Original Wordle game by Josh Wardle
