# 🎂 Ali's Birthday Website

A multi-page birthday surprise made with plain **HTML, CSS and JavaScript** (no frameworks, no backend, nothing sent anywhere).

```
birthday-website/
├── index.html         Page 1 – Landing page + birthday check
├── memories.html      Page 2 – Photo gallery, videos, music
├── surprise.html      Page 3 – Gift box reveal
├── wishes.html        Page 4 – Birthday wishes + cake
├── invitation.html    Page 5 – Party invitation card
├── closing.html       Page 6 – Goodbye + replay
├── css/style.css      All the styling and animations
├── js/script.js       All the interactivity
└── assets/
    ├── images/        ali.jpg, memory1.jpg, memory2.jpg, memory3.jpg
    ├── videos/        memory1.mp4, memory2.mp4
    └── audio/         birthday-music.mp3 (optional)
```

Flow: **1 → 2 → 3 → 4 → 5 → 6 → back to 1**

## ✏️ Things to customise

| What | Where |
|---|---|
| Birth **year** (optional check) | `js/script.js` → `CONFIG.birthYear` (leave `null` to accept any year) |
| Turn off the "unlock first" rule while editing | `js/script.js` → `CONFIG.requireUnlock = false` |
| Photos | Replace the files in `assets/images/` (keep the same names) |
| Videos | Add `memory1.mp4` and `memory2.mp4` to `assets/videos/` |
| Music | Add `birthday-music.mp3` to `assets/audio/` |
| Messages, captions, wishes | Look for `✏️ EDIT` comments in each `.html` file |
| Invitation time and venue | `invitation.html` → replace `[Add Time]` and `[Add Venue]` |
| Colours | `css/style.css` → the `:root` section at the top |

Missing photos, videos and music never break the page — a friendly placeholder or message is shown instead.

## 👀 Testing on your computer

Double-click `index.html`. (When opened this way every page can be opened directly; the "unlock first" rule only applies once the site is online.)

## 🚀 Publishing on GitHub Pages

1. Create a new repository on GitHub and upload everything inside `birthday-website/` (so `index.html` is at the top level).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. After a minute your site is live at `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

All paths are relative, so it works in a sub-folder like this.

> Note: GitHub Pages sites are public to anyone who has the link. The birthday screen is a fun reveal, **not** security — don't put anything private on the site.

## 🔒 Privacy

- No analytics, no forms sent anywhere, no external fonts or libraries.
- Media never autoplays. Music and videos start only when the visitor presses play.
- The only thing stored is a temporary "birthday entered" flag in the browser tab (cleared when the tab closes or on Replay).
