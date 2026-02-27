export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity"
  | "plus-lighter";

export type LayerType = "single" | "gradient";

export interface Point {
  x: number;
  y: number;
}

export interface ControlPoint extends Point {
  isSmooth?: boolean; // Control points maintain 180deg relationship
}

export interface PathNode extends Point {
  id: string;
  handleIn: ControlPoint;
  handleOut: ControlPoint;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  type: LayerType;
  colors: string[]; // 1 color for single, 2+ for gradient
  blur: number; // 0-200px
  opacity: number; // 0-100%
  blendMode: BlendMode;
  width: string;
  height: string;
  top: string;
  left: string;
  rotation: number;
  borderRadius: string;
  path?: PathNode[]; // Optional path data for freeform shapes
}

export interface Theme {
  id: string;
  category: string;
  name: string;
  previewColors: string[];
  backgroundColor: string;
  noise: number;
  layers: Layer[];
}
