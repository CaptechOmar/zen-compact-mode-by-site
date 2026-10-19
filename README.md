# Compact Sidebar by Site

Switches Zen's compact mode (hidden sidebar) on or off depending on the site in the current tab.

- On a listed site (default: `admin.shopify.com`) the sidebar goes into compact mode.
- On any other website the sidebar comes back.
- Internal pages (`about:`, new tab, etc.) are ignored and keep the current state.
- A manual toggle sticks until you move to a different kind of site (listed vs. not listed).

## Settings (Sine mod settings)

- **Sites**: comma-separated hostnames, e.g. `admin.shopify.com, github.com`. Subdomains match.
- **Invert**: compact everywhere except the listed sites.

## Requirements

Sine with JavaScript enabled for the mod (or fx-autoconfig with the script in `chrome/JS/`).
