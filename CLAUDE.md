# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Archive of Meme is a digital meme museum that publishes one iconic meme daily as an NFT on OpenSea. The web displays the "meme of the day" with a countdown timer and an archive of previous memes.

## Commands

```bash
# Development
npm run dev          # Start development server on localhost:3000

# Build
npm run build        # Create production build
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

## Architecture

### Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Data:** Local JSON file (`src/data/memes.json`)

### Key Files

| File | Purpose |
|------|---------|
| `src/data/memes.json` | Meme database - edit this to add new memes |
| `src/app/page.js` | Main page that assembles all components |
| `src/app/layout.js` | Root layout with SEO metadata |
| `public/memes/` | Meme images (named by ID: `1.png`, `2.png`, etc.) |

### Components (`src/components/`)

- **Header.jsx** - Fixed navigation with logo and social links
- **MemeOfTheDay.jsx** - Hero section showing current meme with CTA button
- **Countdown.jsx** - Real-time countdown to next meme (client component)
- **MemeArchive.jsx** - Grid gallery of previous memes
- **Footer.jsx** - Site footer with links

### Data Structure

```json
{
  "currentMeme": 3,           // ID of featured meme
  "nextMemeTime": "ISO-8601", // Countdown target
  "memes": [
    {
      "id": 3,
      "name": "Trollface",
      "image": "/memes/3.png",
      "date": "2026-01-08",
      "opensea_url": "https://opensea.io/...",
      "description": "Optional description"
    }
  ]
}
```

## Adding a New Meme

1. Add image to `public/memes/` (e.g., `4.png`)
2. Edit `src/data/memes.json`:
   - Add new meme object to `memes` array
   - Update `currentMeme` to new ID
   - Update `nextMemeTime` to next day 15:00 UTC

## Design System

- **Background:** `#0a0a0a`
- **Text:** `#ffffff` (primary), `#a0a0a0` (secondary)
- **Accent:** `#00ff88` (green for CTAs)
- **Borders:** `#2a2a2a`
- **Cards:** `#1a1a1a`

## External Links

Social links are configured in `Header.jsx` and `Footer.jsx`. Update the URLs when creating actual accounts:
- Twitter: `https://twitter.com/archiveofmeme`
- OpenSea: `https://opensea.io/collection/archive-of-meme`
- Discord: `https://discord.gg/archiveofmeme`
