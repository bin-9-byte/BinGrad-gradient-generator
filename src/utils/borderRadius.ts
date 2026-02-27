export interface BorderRadius {
  tl: { x: number; y: number };
  tr: { x: number; y: number };
  br: { x: number; y: number };
  bl: { x: number; y: number };
}

/**
 * Parses a CSS border-radius string into a structured object.
 * Supports standard syntax: "tl tr br bl / tl tr br bl" or simplified versions.
 * Assumes all values are percentages for now, as per the current theme data.
 */
export function parseBorderRadius(radiusStr: string): BorderRadius {
  const parts = radiusStr.split("/").map((s) => s.trim().split(/\s+/));
  
  const horizontal = parts[0].map((s) => parseFloat(s));
  const vertical = parts[1] ? parts[1].map((s) => parseFloat(s)) : [...horizontal];

  // Expand shorthand (1, 2, 3, or 4 values) to 4 values
  const expand = (arr: number[]) => {
    if (arr.length === 1) return [arr[0], arr[0], arr[0], arr[0]];
    if (arr.length === 2) return [arr[0], arr[1], arr[0], arr[1]];
    if (arr.length === 3) return [arr[0], arr[1], arr[2], arr[1]]; // CSS spec: if 3, 4th is same as 2nd
    return arr;
  };

  const h = expand(horizontal);
  const v = expand(vertical);

  return {
    tl: { x: h[0], y: v[0] },
    tr: { x: h[1], y: v[1] },
    br: { x: h[2], y: v[2] },
    bl: { x: h[3], y: v[3] },
  };
}

/**
 * Stringifies a BorderRadius object back to CSS syntax.
 */
export function stringifyBorderRadius(radius: BorderRadius): string {
  const { tl, tr, br, bl } = radius;
  return `${tl.x}% ${tr.x}% ${br.x}% ${bl.x}% / ${tl.y}% ${tr.y}% ${br.y}% ${bl.y}%`;
}
