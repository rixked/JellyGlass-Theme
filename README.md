# JellyGlass

A liquid-glass theme for **Jellyfin 12** (built and tested on 12.1, web client). It adds frosted-glass surfaces, cinematic movie and show pages, a minimal video player and a mint-green accent. Everything is pure CSS: no plugins and no server changes.

## Install

1. Open **Dashboard → General → Custom CSS code**.
2. Paste this single line:

   ```css
   @import url("https://cdn.jsdelivr.net/gh/rixked/JellyGlass-Theme@main/jellyglass.css");
   ```

3. Click **Save**, then hard-refresh the browser (`Ctrl + Shift + R`). In the phone app, close and reopen it.

The theme now updates automatically whenever this repo changes. jsDelivr caches files for up to about 12 hours. To get a change right away, open
`https://purge.jsdelivr.net/gh/rixked/JellyGlass-Theme@main/jellyglass.css` once.

If you'd rather not load anything from outside, paste the full contents of [`jellyglass.css`](jellyglass.css) into the box instead.

**Recommended:** Settings → Display → turn on **Backdrops**. The glass looks best with artwork behind it.

## What it changes

| Area | Look |
| --- | --- |
| Header | Floating glass capsule; library links as pills; quiet glass library toolbar |
| Cards & posters | Rounded glass rim; on hover the card lifts with a 3D tilt and casts an "aura" in its own colours (no blur) |
| Badges | Frosted "unwatched" counter with a green dot; green watched checkmarks |
| Movie / show page (desktop) | Full-screen artwork, centered logo, white *Play* pill, two columns (details left, *Next Up* right), adaptive background tinted by the artwork |
| Movie / show page (phone) | Tall artwork that fades into the page, centered logo, wide *Play* pill |
| Season page | Episodes as glass rows with a compact 16:9 thumbnail; watched episodes dimmed |
| Home page | Small uppercase section labels; larger *Continue Watching* / *Next Up* cards; library tiles as banners |
| Search | Glass search pill; suggestions as pills |
| Person pages | Round portrait, filmography in labelled rows |
| Video player | Minimal controls (no box), thin progress line, clear chapter markers, glass *Skip Intro* button (works with Intro Skipper), glass *Up Next* card, glass audio/subtitle/settings menus |
| Dropdowns | Audio/subtitle pickers as glass pills; the open list is a glass panel in Chromium browsers |
| Settings, filters, login | Glass panels, green focus rings, cleaned-up filter and sort panels |

## Customising

### Theme colour (one line)

The whole theme colour comes from **one value**. That covers glows, buttons, checkmarks, focus rings, the background glow, and Jellyfin's own checkboxes, switches and sliders. Lighter and darker shades are calculated automatically. Add this **below** the `@import` line and put in your colour as `Red Green Blue` (0–255):

```css
:root {
  --lg-accent-rgb: 168 85 247;   /* purple */
}
```

| Colour | Value |
| --- | --- |
| Mint green (default) | `52 211 153` |
| Blue | `59 130 246` |
| Purple | `168 85 247` |
| Pink | `236 72 153` |
| Orange | `249 115 22` |
| Red | `239 68 68` |

Any colour picker shows these three numbers as "RGB". If you choose a **dark** colour, also set the text that sits on coloured buttons to white:

```css
:root {
  --lg-accent-rgb: 30 64 175;
  --lg-on-accent: #fff;
}
```

### Other tokens

Shapes and glass strength are tokens at the top of the file (section 1) too, for example `--lg-r` (card corner radius) or `--lg-blur`. Override them the same way.

Each part of the theme is a numbered section, so you can switch off a single part by overriding or removing that section in a pasted copy. For example, section 14 is the video player, and removing it gives you the stock player back.

## Compatibility

- **Browsers:** current Chrome, Edge, Opera, Firefox and Safari. The glass dropdown lists use the new *customizable select* feature, which works in Chromium browsers. Firefox and Safari show a normal dark list instead.
- **Jellyfin apps:** the Android/iOS apps and the LG/webOS app use the web client, so they pick up the theme. The movie-page hero layout is limited to desktop and phone; TV layout keeps Jellyfin's own detail page.
- **Not themed on purpose:** the admin dashboard, the music *Now Playing* screen and the video image itself.
- **Low-end devices:** the glass effects use `backdrop-filter`. If a very old device stutters, enable *Reduce transparency* in the OS. The theme then falls back to solid panels.

Major Jellyfin updates can rename internal classes. If something looks off after an update, please open an issue with a screenshot.
