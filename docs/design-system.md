# Design system

Blank Wall uses one token layer in [`extension/shared/theme.css`](../extension/shared/theme.css), shared components in [`extension/shared/components.css`](../extension/shared/components.css), and one inline SVG sprite in [`extension/shared/icons.svg`](../extension/shared/icons.svg). Every page loads the three shared files before its own stylesheet. `shared/ui.js` provides the icon builder, in-theme confirmation dialog, and toast helper. This document is the short contributor reference for the tokens, components, and rules behind them.

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
| Layout | `--popup-width` 320px, `--sidebar-width` 220px, `--content-max` 720px, `--measure` 65ch, `--page-padding` `var(--space-6)`, `--panel-width` 320px, `--note-max-width` 280px |
| Radius | `--radius-sm` 4px, `--radius` 6px, `--radius-lg` 10px, `--radius-round` 50% |
| Controls | `--control-height-compact` 28px, `--control-height` 32px, `--control-number-width` 72px, `--control-select-width` 180px, `--icon-button-size` 32px, `--icon-size` 18px, `--nav-indicator-width` 2px, `--disabled-opacity` 0.4, `--action-idle-opacity` 0.6 |
| Switch | `--switch-width` 36px, `--switch-height` 20px, `--switch-knob` 14px, `--switch-gap` 2px, `--switch-travel` 18px |

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
| Elevation | `--backdrop` `rgba(0, 0, 0, 0.6)`, `--shadow-dialog` — one subtle shadow for dialogs and toasts |
| Sizing | `--dialog-width` 420px, `--toast-width` 320px, `--toast-duration` 4000ms |
| Motion | `--duration-fast` 120ms, `--duration-normal` 160ms, `--ease-out` `cubic-bezier(0.2, 0, 0, 1)` |
| Layers | `--z-base` 0, `--z-dialog` 100, `--z-toast` 110 |

## Base layer

`theme.css` provides the global reset and defaults: `box-sizing`, zeroed margins, scrollbar colors, body typography, heading defaults, link colors, inherited form-control typography, `accent-color` for checkboxes/radios, themed placeholders and selection, a `:focus-visible` ring, and a `prefers-reduced-motion` rule. Page-specific layout stays in the page stylesheet.

## Components

`components.css` owns the appearance of every interactive element. Each component has default, hover, active, focus-visible, and disabled states; form controls also have focus, invalid, and placeholder states.

| Component | Classes | Use |
| --- | --- | --- |
| Buttons | `.button` with `--primary`, `--secondary`, `--ghost`, `--danger`, `--icon` | Primary is the accent action; secondary is a bordered raised surface; ghost is text-only navigation; danger is only for destructive actions. No pills. |
| Icon | `.icon` | 18px square, `currentColor`; reference `shared/icons.svg` with `<use href="../shared/icons.svg#icon-name">` or `icon(name)` from `ui.js`. Icon-only buttons need `aria-label` and `title`. |
| Fields | `.input`, `.textarea`, `.select`, `.field-help`, `.field-error` | One height, one radius, one focus ring, one border. Set `aria-invalid` for the danger border; put helper or error text directly below. |
| Switch | `.switch`, `.switch__input`, `.switch__track` | A real checkbox with `role="switch"`, visually hidden but keyboard operable; the track shows state and focus. |
| Chip and badge | `.chip`, `.badge` | Compact hostnames, counts, and status. Muted by default; badge uses accent-subtle. |
| List row | `.list-row`, `.list-row__actions` | Primary text with muted meta above a subtle divider; actions align right and appear on hover or focus-within. |
| Dialog | `.dialog`, `.dialog__title`, `.dialog__message`, `.dialog__footer` | Native `<dialog>` opened with `showModal()`. Header, message, then right-aligned actions with Cancel left of the primary action. Never use `alert()`, `confirm()`, or `prompt()`. |
| Toast | `.toast-host`, `.toast` with `--success`, `--danger` | Bottom-corner, `aria-live="polite"`, auto-dismiss after `--toast-duration`. |
| Empty state | `.empty-state` | One calm sentence, optionally followed by the next action. |

`shared/ui.js` exposes `icon(name)`, `askConfirm({ title, message, confirmLabel, cancelLabel, danger })`, and `showToast(message, tone)`. `askConfirm` returns a promise that resolves true only when the primary action is used; Escape and Cancel resolve false. Calls are serialized so a second dialog cannot open over the first.

## UI change checklist

1. Load `shared/theme.css`, then `shared/components.css`, then the page stylesheet.
2. Use tokens for every visual value; if a value is needed twice, add a token.
3. Use a component class instead of restyling a control in page CSS.
4. Keep user-entered text as `textContent`; avoid `innerHTML`, inline styles, and `!important`.
5. Add default, hover, active, focus-visible, and disabled states to new controls.
6. Use `askConfirm` and `showToast` for confirmations and transient status, and `icon()` or the sprite for icons.
7. Run `node --test tests/` from the repository root; no install step is needed.
