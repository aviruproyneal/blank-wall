# Design system

Blank Wall uses one token layer in [`extension/shared/theme.css`](../extension/shared/theme.css). Every page loads it before its own stylesheet. This document is the short contributor reference for the tokens and the rules behind them.

## Principles

- **Restraint:** create hierarchy with type size, weight, color level, and whitespace, not boxes. Prefer dividers and spacing over containers. One focal point per screen.
- **One system:** every color, size, space, radius, shadow, duration, easing, and layer comes from a token in `theme.css`. No hard-coded hex values, `rgb(...)`, pixel spacing, or font sizes in page CSS. No `!important`, inline `style` attributes, gradients, glow, or emoji.
- **Typography:** native system fonts only. UI uses `--font-ui`; Guide and wall headings may use `--font-serif`; timers and numbers use `--font-mono` or tabular figures. Use the 4px-based type scale and weights 400, 500, and 600 only.
- **Color:** neutral dark surfaces, three text levels, one muted purple accent, and muted status colors. Text tokens meet WCAG AA on every surface. Decorative borders stay low-contrast. Never use `--accent` for errors; use `--danger`.
- **Layout:** 4px spacing scale, one left edge per content column, aligned baselines in rows, and consistent control heights. Dashboard main column is `--content-max`; sidebar is `--sidebar-width`; popup is `--popup-width`.
- **Shape and depth:** radii are 4px, 6px, and 10px only. Borders are 1px low-alpha lines. Dialogs get one subtle shadow over a dimmed backdrop; no colored or blurry shadows.
- **States and motion:** every interactive element needs default, hover, active, focus-visible, and disabled states. Inputs also need placeholder and invalid states. Motion uses opacity/transform only, 120–160ms ease-out, and is disabled under `prefers-reduced-motion`.
- **Accessibility:** keyboard reachable, visible focus, logical tab order, labels bound to inputs, `aria-label` on icon buttons, minimum 24px targets (28px in the popup), and no meaning conveyed by color alone. Render user text with `textContent`, never `innerHTML`.

## Color tokens

| Group | Tokens |
| --- | --- |
| Surfaces | `--surface-sunken` `#181818`, `--surface-base` `#1e1e1e`, `--surface-raised` `#262626`, `--surface-hover` `#2e2e2e`, `--surface-active` `#363636`, `--surface-overlay` `#262626` |
| Text | `--text` `#dadada`, `--text-muted` `#b8b8b8`, `--text-faint` `#a2a2a2`, `--text-on-accent` `#17131f` |
| Accent | `--accent` `#b39ddb`, `--accent-hover` `#c7b6ec`, `--accent-active` `#9b7fd4`, `--accent-subtle` `rgba(179, 157, 219, 0.14)`, `--focus-ring` `rgba(179, 157, 219, 0.4)` |
| Status | `--success` `#86b894`, `--warning` `#d1ad72`, `--danger` `#d98f8f`, plus `--success-subtle`, `--warning-subtle`, `--danger-subtle` low-alpha backgrounds |
| Borders | `--border-width` `1px`, `--border-subtle` `rgba(255, 255, 255, 0.06)`, `--border` `rgba(255, 255, 255, 0.1)`, `--border-strong` `rgba(255, 255, 255, 0.16)` |
| Focus | `--focus-width` `2px`, `--focus-offset` `2px` |

Contrast ratios, computed against the darkest-to-lightest surfaces:

| Token | Sunken | Base | Raised | Hover | Active |
| --- | ---: | ---: | ---: | ---: | ---: |
| `--text` | 12.70 | 11.93 | 10.83 | 9.71 | 8.64 |
| `--text-muted` | 8.19 | 7.69 | 6.98 | 6.26 | 5.57 |
| `--text-faint` | 6.96 | 6.53 | 5.93 | 5.32 | 4.73 |
| `--accent` | 7.41 | 6.96 | 6.31 | 5.67 | 5.04 |

`--text-on-accent` reaches 7.62:1 on `--accent`, 9.86:1 on `--accent-hover`, and 5.55:1 on `--accent-active`. Status colors are worst-case 5.35:1 (success), 5.72:1 (warning), and 4.76:1 (danger) on `--surface-active`. The wall timer uses `--text-faint` at full opacity, giving 6.53:1 on the wall background; this exceeds the 3:1 minimum for deliberately quiet numerals.

## Spacing and layout

| Group | Tokens |
| --- | --- |
| Spacing | `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-5` 20px, `--space-6` 24px, `--space-7` 32px, `--space-8` 40px, `--space-9` 48px |
| Layout | `--popup-width` 320px, `--sidebar-width` 220px, `--content-max` 720px, `--measure` 65ch, `--page-padding` `var(--space-6)` |
| Radius | `--radius-sm` 4px, `--radius` 6px, `--radius-lg` 10px |
| Controls | `--control-height-compact` 28px, `--control-height` 32px, `--icon-button-size` 32px |

Spacing remap from the previous theme: old `--space-5` (24px) is now `--space-6`; old `--space-6` (32px) is now `--space-7`. `--space-5` is now 20px.

## Typography

| Group | Tokens |
| --- | --- |
| Fonts | `--font-ui`, `--font-serif`, `--font-mono` |
| Sizes | `--text-12`, `--text-13`, `--text-14`, `--text-16`, `--text-20`, `--text-28` |
| Line height | `--line-body` 1.5, `--line-heading` 1.3 |
| Weight | `--weight-regular` 400, `--weight-medium` 500, `--weight-semibold` 600 |
| Detail | `--tracking-label` 0.04em |

The base layer sets body text to `--text-14`; the popup will use `--text-13` as its compact base. Headings use `--weight-semibold` and balanced wrapping; body copy uses `--line-body` and pretty wrapping.

## Elevation, motion, and layers

| Group | Tokens |
| --- | --- |
| Elevation | `--shadow-dialog` — one subtle shadow for dialogs |
| Motion | `--duration-fast` 120ms, `--duration-normal` 160ms, `--ease-out` `cubic-bezier(0.2, 0, 0, 1)` |
| Layers | `--z-base` 0, `--z-dialog` 100, `--z-toast` 110 |

## Base layer

`theme.css` provides the global reset and defaults: `box-sizing`, zeroed margins, scrollbar colors, body typography, heading defaults, link colors, inherited form-control typography, `accent-color` for checkboxes/radios, themed placeholders and selection, a `:focus-visible` ring, and a `prefers-reduced-motion` rule. It does **not** yet define components, icons, dialogs, or toasts; those are added in later milestones.

## UI change checklist

1. Load `shared/theme.css` before the page stylesheet.
2. Use tokens for every visual value; if a value is needed twice, add a token.
3. Keep user-entered text as `textContent`; avoid `innerHTML`, inline styles, and `!important`.
4. Add default, hover, active, focus-visible, and disabled states to new controls.
5. Run `node --test tests/` from the repository root; no install step is needed.
