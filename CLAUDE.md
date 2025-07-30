# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `yarn dev` - Builds backend and starts Vite dev server on arcade.ownsite.local:3000
- **Build project**: `yarn build` - Builds both backend and frontend for production
- **Build backend only**: `yarn build:backend` - Compiles TypeScript backend files with esbuild
- **Start production server**: `yarn start` - Runs the production Express server
- **Type checking/linting**: `yarn lint` (runs `tsc --noEmit`)
- **Mayhem Manager testing**: `yarn mm-test` - Runs simulation test fights (AI should not run this)

## Architecture Overview

Damien's Arcade is a multi-game web platform built with SvelteKit, Express.js, TypeScript, and Socket.io. The architecture follows a room-based multiplayer game server pattern:

### Backend Structure
- **Room Management**: `src/lib/backend/room-manager.ts` manages game room lifecycle and room code generation
- **Game Rooms**: `src/lib/backend/game-room.ts` handles individual game sessions, player connections, authentication via JWT, and packet queuing
- **Game Logic Handlers**: Each game extends `game-logic-handler-base.ts` to implement game-specific logic
- **Server Entry**: `app.js` sets up Express server with Socket.io integration and REST endpoints for room creation

### Frontend Structure
- **SvelteKit Routes**: Games are organized under `src/routes/[game-name]/[roomCode]/+page.svelte`
- **Game Libraries**: Each game has its own directory under `src/lib/` with components, types, and utilities
- **Shared Components**: Common UI elements in `src/lib/` (room settings, event logs, menus)

### Game Integration Pattern
Games follow a consistent pattern:
1. Game logic handler extends base class with packet handling and game state management
2. Frontend components use stores for state management and Socket.io for real-time communication
3. Game types are registered in `src/lib/types.ts` and routing in `app.js`

### Current Games
- **Auction Tic-Tac-Toe**: Turn-based strategy game with bidding mechanics
- **Mayhem Manager**: Tournament-style fighter management game (in development)
- **Daily Q-less**: Word puzzle game with daily challenges

### Key Technologies
- **Build System**: Vite for frontend, esbuild for backend compilation
- **Authentication**: JWT tokens with cookie-based sessions [human note: not really used or tested yet, not really important either]
- **Real-time Communication**: Socket.io with packet queuing system
- **Graphics**: PIXI.js integration via svelte-pixi for game rendering for Mayhem Manager; others are HTML5 elements only
- **Validation**: Zod schemas for packet validation

### Development Patterns
- TypeScript interfaces define game states and packet structures
- Game rooms auto-teardown after inactivity (1 hour)
- Packet handling uses a queue system to prevent race conditions [human's note: does this actually matter/work?]
- Static assets organized by game (equipment images, sounds, etc.)

### Context about deployment
The site runs in production at arcade.damiensnyder.com, alongside www.damiensnyder.com which is a
totally different repo. But this is a dev branch here.