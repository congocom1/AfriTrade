import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names with tailwind-merge for deduplication
 * @param {...string} inputs - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}


// Form validation utilities

/**
 * Check if a value is a valid HSL color string
 * @param {string} value - HSL color string (e.g., "120 50% 30%")
 * @returns {boolean} True if valid HSL format
 */
export function isValidHSLColor(value) {
  if (!value) return false;
  const hslRegex = /^\d+\s+\d+%\s+\d+%$/;
  return hslRegex.test(value.trim());
}

/**
 * Calculate contrast ratio between two HSL colors
 * @param {string} _fg - Foreground HSL color
 * @param {string} _bg - Background HSL color
 * @returns {number} WCAG contrast ratio
 */
export function getContrastRatio(_fg, _bg) {
  // Simplified contrast ratio calculation
  // For production use, consider a more robust implementation
  // Return actual WCAG contrast ratio if color parsing is available
  try {
    // Try to extract luminance from HSL values if they're available
    const getLuminance = (hsl) => {
      if (!hsl) return 0.5;
      const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+%)/);
      if (!match) return 0.5;
      const h = parseInt(match[1]);
      const s = parseInt(match[2]);
      const l = parseInt(match[3]);

      // Convert HSL to RGB approximation for luminance
      const sNorm = s / 100;
      const lNorm = l / 100;
      let r, g, b;

      if (sNorm === 0) {
        r = g = b = lNorm;
      } else {
        const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm - lNorm * sNorm + sNorm;
        const p = 2 * lNorm - q;
        r = hueToRgb(p, q, (h + 240) % 360);
        g = hueToRgb(p, q, (h + 120) % 360);
        b = hueToRgb(p, q, h % 360);
      }

      return (0.2126 * r + 0.7152 * g + 0.0722 * b).toFixed(2);
    };

    const hueToRgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const luminance = parseFloat(getLuminance(_fg)) || 0.5;
    const bgLuminance = parseFloat(getLuminance(_bg)) || 0.5;
    const ratio = (Math.max(luminance, bgLuminance) + 0.05) / (Math.min(luminance, bgLuminance) + 0.05);
    return Math.round(ratio * 100) / 100;
  } catch {
    // Fallback to default WCAG AA value
    return 4.5;
  }
}

/**
 * Check if the current window is inside an iframe
 * @returns {boolean} True if in iframe
 */
export const isIframe = window.self !== window.top;
