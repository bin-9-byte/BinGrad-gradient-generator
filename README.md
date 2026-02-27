# BinGrad Gradient Generator

BinGrad Gradient Generator is a fluid, layer-based gradient design tool built with React and Vite. It allows users to create stunning, complex gradients by layering multiple shapes, colors, and effects.

## Features

- **Layer Management**: Add, remove, hide, and reorder layers to compose complex visuals.
- **Advanced Styling**: precise control over blur, opacity, blend modes, rotation, and border radius for each layer.
- **Gradient & Solid Colors**: Support for both linear gradients and solid color fills.
- **Path Editing**: Manipulate layer shapes with path nodes and handles for custom geometries.
- **Theme Presets**: Choose from a collection of professionally designed themes (e.g., Neon Night, Fluid Day).
- **History System**: Full Undo/Redo support for a worry-free design process.
- **Export**: Export your creations as high-quality PNG images.
- **Responsive Canvas**: Automatically adjusts to your viewport while maintaining aspect ratio.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/) (Framer Motion)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Image Generation**: [html-to-image](https://github.com/bubkoo/html-to-image)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd buzzed-gradient-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

## Project Structure

```
src/
├── components/     # UI components (Canvas, LayerEditor, Sidebars)
├── data/          # Theme presets and initial data
├── hooks/         # Custom hooks (e.g., useHistory)
├── utils/         # Helper functions for paths, colors, border radius
├── App.tsx        # Main application component
├── types.ts       # TypeScript type definitions
└── main.tsx       # Entry point
```

## Usage

- **Left Sidebar**: Browse and select from available themes to start with a preset.
- **Center Canvas**: View and interact with your gradient design. Click on layers to select them. Drag handles to reshape.
- **Right Sidebar**: Edit properties of the selected layer (colors, blur, blend mode) or the global theme settings (background color, noise).
- **Export**: Click the download button in the canvas area to save your design as a PNG.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
