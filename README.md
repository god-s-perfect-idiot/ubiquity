# Ubiquity

A modern, minimalist operating system interface built with SvelteKit.

## Features

- **Modern UI**: Clean, minimalist design with smooth animations
- **File Management**: Browse and manage your files with an intuitive interface
- **Media Support**: View photos, play music and videos
- **Spotify Integration**: Full Spotify integration with authentication, playback controls, and music library access
- **Marketplace**: Discover and install new applications
- **Settings**: Customize your experience
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ubiquity
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Spotify Integration

The application includes full Spotify integration with the following features:

- **User Authentication**: Secure OAuth2 authentication with Spotify
- **Profile Management**: View your Spotify profile, followers, and account details
- **Music Library**: Access your playlists, saved tracks, and top music
- **Playback Controls**: Play, pause, skip tracks, and control playback
- **Search**: Search for tracks and artists
- **Real-time Updates**: See currently playing tracks and playback status

### Setting up Spotify

1. Follow the [Spotify Setup Guide](SPOTIFY_SETUP.md) for detailed instructions
2. Create a Spotify app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
3. Configure your Client ID and redirect URI
4. Start enjoying your music!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linting
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── components/          # Reusable UI components
├── kernel/             # Core system utilities
├── lib/                # Library files and utilities
├── routes/             # Application pages and routing
└── store/              # State management
```

## Technologies Used

- **Frontend**: SvelteKit, Svelte 4
- **Styling**: Tailwind CSS
- **Icons**: Iconify
- **Music**: Spotify Web API
- **Build Tool**: Vite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
