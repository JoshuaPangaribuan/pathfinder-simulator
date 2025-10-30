# Frontend Documentation

This directory contains the React + TypeScript frontend application for the Pathfinder & Maze Visualizer. The application provides an interactive interface for generating mazes and visualizing pathfinding algorithms (BFS, DFS, and A*).

## Architecture Overview

The frontend follows a modern React architecture with:
- **Component-based UI** using React 19 and TypeScript
- **State management** via Zustand for global application state
- **Custom hooks** for service integration and animation logic
- **Canvas-based rendering** for smooth maze visualization
- **Responsive design** using Tailwind CSS

## Project Structure

```
web/
├── src/
│   ├── api/              # API client and request functions
│   │   ├── client.ts     # Axios instance and interceptors
│   │   └── index.ts      # API function exports
│   │
│   ├── components/       # React components
│   │   ├── controls/     # Control panel sub-components
│   │   │   ├── AlgorithmSelector.tsx
│   │   │   ├── CellSelector.tsx
│   │   │   └── MazeGenerator.tsx
│   │   ├── forms/        # Form input components
│   │   │   ├── DimensionInput.tsx
│   │   │   └── SeedInput.tsx
│   │   ├── ControlsPanel.tsx    # Main control panel
│   │   ├── GridCanvas.tsx       # Canvas-based maze renderer
│   │   ├── StatsPanel.tsx       # Algorithm statistics display
│   │   ├── ErrorBoundary.tsx    # Error handling component
│   │   └── ToastContainer.tsx   # Toast notification system
│   │
│   ├── hooks/            # Custom React hooks
│   │   ├── useMazeService.ts        # Maze generation service hook
│   │   ├── useSimulationService.ts  # Pathfinding simulation hook
│   │   ├── useSimulationAnimation.ts # Animation orchestration hook
│   │   └── useToast.tsx            # Toast notification hook
│   │
│   ├── store/            # Zustand state management
│   │   └── useAppStore.ts  # Global application state
│   │
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts       # Shared types and interfaces
│   │
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
│
├── dist/                 # Production build output (generated)
├── node_modules/         # Dependencies (generated)
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts
```

## Data Flow

### 1. Maze Generation Flow

```
User Input (ControlsPanel)
    ↓
useMazeService Hook
    ↓
API Client (client.ts)
    ↓
POST /maze/generate
    ↓
Backend Response
    ↓
useAppStore.setMaze()
    ↓
GridCanvas renders new maze
```

**Key Components:**
- `ControlsPanel`: User interface for maze dimensions and seed input
- `useMazeService`: Manages API call, loading state, and error handling
- `apiClient`: Axios instance with error interceptors
- `useAppStore`: Global state store that triggers re-renders

### 2. Pathfinding Simulation Flow

```
User Clicks "Run Pathfinding"
    ↓
ControlsPanel.handleRun()
    ↓
useSimulationService.runSimulation()
    ↓
API Client POST /simulate
    ↓
Backend computes pathfinding
    ↓
useAppStore.setSimulationResult()
    ↓
useSimulationAnimation detects new visitedOrder
    ↓
Animation loop increments visitedCount
    ↓
GridCanvas renders visited nodes progressively
    ↓
Path overlay shown when animation completes
```

**Key Components:**
- `ControlsPanel`: Validates start/goal selection and triggers simulation
- `useSimulationService`: Manages API call with abort controller support
- `useSimulationAnimation`: Orchestrates frame-by-frame animation using timeouts
- `GridCanvas`: Efficiently renders incremental updates using Canvas API

### 3. State Management Flow

The application uses **Zustand** for global state with the following structure:

```typescript
AppState {
  maze: Grid | null              // Current maze grid
  start: Point | null            // Selected start cell
  goal: Point | null             // Selected goal cell
  algorithm: Algorithm           // Selected algorithm (bfs/dfs/astar)
  visitedOrder: Point[]          // All visited nodes in order
  path: Point[]                  // Final path if found
  stats: SimulationStats | null  // Performance metrics
  isAnimating: boolean           // Animation state
  animationSpeed: number         // Milliseconds per frame
  resultsByAlgorithm: { ... }    // Cached results per algorithm
}
```

**State Updates:**
- `setMaze()`: Called when new maze is generated, resets start/goal
- `setSimulationResult()`: Stores complete simulation result
- `setIsAnimating()`: Controls animation lifecycle
- `resetSimulation()`: Clears current simulation without clearing cache

## Component Details

### App.tsx
The root component that orchestrates the entire application:
- Manages selection mode (start/goal) state
- Provides layout structure (header + split view)
- Wraps application in ErrorBoundary and ToastProvider
- Handles cell selection logic

**Layout:**
- Desktop: Side-by-side (30% controls, 70% maze)
- Mobile: Stacked (30% controls height, 70% maze height)

### GridCanvas.tsx
High-performance canvas-based maze renderer:
- **Rendering Strategy**: Incremental updates using `visitedCount` to avoid full redraws
- **Device Pixel Ratio**: Handles high-DPI displays correctly
- **Resize Handling**: Uses ResizeObserver for responsive sizing
- **Visual Layers**:
  1. Base grid (walls/spaces)
  2. Visited nodes (animated with intensity gradient)
  3. Path overlay (shown after animation)
  4. Start/goal markers (circles)
  5. Hover effect (on valid cells)

**Performance Optimizations:**
- Uses refs to avoid unnecessary re-renders
- Incremental drawing: only draws new visited nodes each frame
- Canvas transforms for high-DPI support

### ControlsPanel.tsx
Main control interface with responsive design:
- **Desktop**: Full expanded layout
- **Mobile**: Collapsible sections using `<details>` elements
- **Features**:
  - Maze dimension inputs with validation
  - Algorithm selection dropdown
  - Animation speed slider
  - Start/goal selection mode toggle
  - Run pathfinding button

### useSimulationAnimation.ts
Animation orchestration hook that:
- Watches `visitedOrder` from store
- Incrementally updates `visitedCount` using timeouts
- Respects `animationSpeed` setting
- Provides `skip()` function to immediately complete animation
- Manages animation lifecycle (start/stop)

**Animation Logic:**
```typescript
// For each frame:
visitedCount = Math.min(visitedCount + 1, visitedOrder.length)
setTimeout(() => nextFrame(), animationSpeed)

// When complete:
setShowPath(true)
setIsAnimating(false)
```

### useMazeService.ts & useSimulationService.ts
Service hooks that abstract API calls:
- Manage loading states (`isGenerating`, `isRunning`)
- Handle errors consistently
- Update global store on success
- Support request cancellation (simulation only)

### useAppStore.ts
Zustand store providing:
- Centralized state management
- Type-safe selectors
- Computed state (e.g., `canRun` in ControlsPanel)
- Cache of results by algorithm for comparison

## API Integration

### Client Configuration
- Base URL: Configurable via `VITE_API_BASE_URL` environment variable
- Default: Empty string (uses relative URLs, proxied in dev)
- Timeout: 15 seconds
- Error Handling: Interceptors convert Axios errors to user-friendly messages

### Development Proxy
Vite dev server proxies API requests:
```typescript
// vite.config.ts
server: {
  proxy: {
    "/maze": "http://localhost:8080",
    "/simulate": "http://localhost:8080",
  }
}
```

### API Endpoints

**Generate Maze**
```typescript
POST /maze/generate
Request: { width: number, height: number, seed?: number }
Response: { width: number, height: number, grid: Grid, seed?: number }
```

**Run Simulation**
```typescript
POST /simulate
Request: { algorithm: Algorithm, grid: Grid, start: Point, goal: Point }
Response: {
  found: boolean,
  path: Point[],
  visitedOrder: Point[],
  stats: { expandedNodes, pathLength, elapsedMs }
}
```

## Styling

The application uses **Tailwind CSS** for styling:
- **Theme**: Dark slate color scheme with sky/emerald accents
- **Responsive**: Mobile-first approach with `md:` and `lg:` breakpoints
- **Components**: Utility-first classes with custom color palette
- **Animations**: CSS transitions for hover effects and state changes

## Type Safety

All API requests/responses are typed using TypeScript interfaces:
- `GenerateMazeRequest` / `MazeResponse`
- `SimulateRequest` / `SimulateResponse`
- `Point`, `Grid`, `Algorithm`, `SimulationStats`

This ensures type safety across the entire application and prevents runtime errors.

## Development Workflow

### Running Locally
```bash
# Install dependencies
npm install

# Start dev server (proxies to backend on :8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Organization Principles
1. **Separation of Concerns**: UI components, business logic (hooks), and data (store) are separated
2. **Reusability**: Form components and control sub-components are reusable
3. **Type Safety**: All data structures are typed, preventing errors at compile time
4. **Performance**: Canvas rendering optimized for smooth animations
5. **User Experience**: Responsive design, error boundaries, toast notifications

## Key Features

1. **Progressive Animation**: Visited nodes animate frame-by-frame, showing algorithm exploration
2. **Skip Animation**: Users can skip to final result instantly
3. **Algorithm Comparison**: Results cached per algorithm for side-by-side comparison
4. **Responsive Design**: Works seamlessly on desktop and mobile devices
5. **Error Handling**: Graceful error boundaries and user-friendly error messages
6. **Performance Metrics**: Real-time display of path length, expanded nodes, and elapsed time

## Future Enhancements

Potential improvements:
- Pause/resume animation controls
- Export maze as image
- Multiple algorithm comparison view
- Maze generation algorithm selection
- Animation speed presets
- Keyboard shortcuts for common actions
