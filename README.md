# Wordle 2.2 - German Edition

A modern German implementation of the popular Wordle game. This project is originally forked from [woertchen](https://github.com/diondiondion/woertchen) and features a curated German word list with enhanced accessibility and universal keyboard support.

## Features

- **Curated German Words** - High-quality word list
- **Universal Keyboard Support** - Standard A-Z layout works on any keyboard (no special characters required)
- **Cursor-based editing** - Tap any letter in the current row to change it
- **Modern React UI** - Built with Vite, React 18, TypeScript, and Tailwind CSS 4
- **Progressive Web App** - Install and play offline
- **Dark Mode Support** - Comfortable gameplay in any lighting
- **Statistics Tracking** - Track your progress and winning streaks
- **Share Results** - Native share or clipboard
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
│   │   └── stats/    # Statistics and progress tracking
│   ├── constants/    # Game settings and word lists
│   ├── context/      # React context providers
│   ├── hooks/        # useGameState, useTheme, useWordOfDay
│   └── lib/          # Utility functions
├── docker/           # Docker / nginx configuration
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
