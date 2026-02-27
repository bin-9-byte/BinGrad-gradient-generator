import { PathNode, Layer } from "../types";

// Helper to generate a unique ID
const uid = () => Math.random().toString(36).substr(2, 9);

/**
 * Converts a simple rectangle/ellipse layer to path nodes if not present.
 * This is a migration helper.
 */
export function ensureLayerPath(layer: Layer): Layer {
  if (layer.path && layer.path.length > 0) return layer;

  // Parse CSS values (e.g. "50%", "-10%")
  const parseVal = (str: string, defaultValue = 50) => {
    if (!str) return defaultValue;
    if (str.endsWith("%")) return parseFloat(str);
    // If it's px or just number, treat as percentage for now or clamp
    return parseFloat(str);
  };

  const width = parseVal(layer.width, 50);
  const height = parseVal(layer.height, 50);
  const left = parseVal(layer.left, 25);
  const top = parseVal(layer.top, 25);
  const rotation = layer.rotation || 0;

  // Center of the layer
  const cx = left + width / 2;
  const cy = top + height / 2;
  
  // Radii
  const rx = width / 2;
  const ry = height / 2;

  // K for bezier circle approximation
  const k = 0.55228474983;

  // Unrotated points relative to center
  const points = [
    { x: 0, y: -ry, hIn: { x: -rx * k, y: -ry }, hOut: { x: rx * k, y: -ry } }, // Top
    { x: rx, y: 0, hIn: { x: rx, y: -ry * k }, hOut: { x: rx, y: ry * k } },   // Right
    { x: 0, y: ry, hIn: { x: rx * k, y: ry }, hOut: { x: -rx * k, y: ry } },   // Bottom
    { x: -rx, y: 0, hIn: { x: -rx, y: ry * k }, hOut: { x: -rx, y: -ry * k } },// Left
  ];

  // Rotation helper
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotate = (x: number, y: number) => ({
    x: x * cos - y * sin + cx,
    y: x * sin + y * cos + cy,
  });

  const nodes: PathNode[] = points.map((p) => {
    const pt = rotate(p.x, p.y);
    const hIn = rotate(p.hIn.x, p.hIn.y);
    const hOut = rotate(p.hOut.x, p.hOut.y);

    return {
      id: uid(),
      x: pt.x,
      y: pt.y,
      handleIn: { x: hIn.x, y: hIn.y },
      handleOut: { x: hOut.x, y: hOut.y },
    };
  });

  return { ...layer, path: nodes };
}

/**
 * Transforms path nodes by moving them.
 */
export function movePath(nodes: PathNode[], dx: number, dy: number): PathNode[] {
    return nodes.map(n => ({
        ...n,
        x: n.x + dx,
        y: n.y + dy,
        handleIn: { x: n.handleIn.x + dx, y: n.handleIn.y + dy },
        handleOut: { x: n.handleOut.x + dx, y: n.handleOut.y + dy }
    }));
}

/**
 * Rotates path nodes around a center point.
 */
export function rotatePath(nodes: PathNode[], angle: number, cx: number, cy: number): PathNode[] {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotate = (x: number, y: number) => ({
        x: (x - cx) * cos - (y - cy) * sin + cx,
        y: (x - cx) * sin + (y - cy) * cos + cy,
    });

    return nodes.map(n => {
        const pt = rotate(n.x, n.y);
        const hIn = rotate(n.handleIn.x, n.handleIn.y);
        const hOut = rotate(n.handleOut.x, n.handleOut.y);

        return {
            ...n,
            x: pt.x,
            y: pt.y,
            handleIn: { ...n.handleIn, x: hIn.x, y: hIn.y },
            handleOut: { ...n.handleOut, x: hOut.x, y: hOut.y }
        };
    });
}

/**
 * Distorts path nodes randomly.
 * Moves anchors and handles slightly to create organic variation.
 */
export function distortPath(nodes: PathNode[], intensity: number = 5): PathNode[] {
    return nodes.map(n => {
        const dx = (Math.random() - 0.5) * intensity;
        const dy = (Math.random() - 0.5) * intensity;
        
        // Move anchor
        const newX = n.x + dx;
        const newY = n.y + dy;
        
        // Move handles independently for more organic feel, or together to maintain smoothness
        // Here we move them relative to the new anchor position, plus some jitter
        const hInDx = (Math.random() - 0.5) * (intensity * 0.5);
        const hInDy = (Math.random() - 0.5) * (intensity * 0.5);
        const hOutDx = (Math.random() - 0.5) * (intensity * 0.5);
        const hOutDy = (Math.random() - 0.5) * (intensity * 0.5);

        return {
            ...n,
            x: newX,
            y: newY,
            handleIn: { 
                ...n.handleIn, 
                x: n.handleIn.x + dx + hInDx, 
                y: n.handleIn.y + dy + hInDy 
            },
            handleOut: { 
                ...n.handleOut, 
                x: n.handleOut.x + dx + hOutDx, 
                y: n.handleOut.y + dy + hOutDy 
            }
        };
    });
}

/**
 * Generates SVG path data string from nodes.
 * Assumes coordinates are in percentages (0-100).
 */
export function generatePathString(nodes: PathNode[]): string {
  if (nodes.length < 2) return "";

  let d = `M ${nodes[0].x} ${nodes[0].y}`;

  for (let i = 0; i < nodes.length; i++) {
    const curr = nodes[i];
    const next = nodes[(i + 1) % nodes.length]; // Loop back to start

    d += ` C ${curr.handleOut.x} ${curr.handleOut.y}, ${next.handleIn.x} ${next.handleIn.y}, ${next.x} ${next.y}`;
  }

  return d + " Z"; // Close path
}
