# Codex Mobile

A clean, modular web app that runs on your machine and can be opened from a phone through a temporary public link.

## Launch

Double-click **Launch Codex Mobile.bat**. Your browser opens the local app automatically. The launcher window prints a temporary public URL that you can open on your phone.

Keep the launcher window open while using either link. Closing it stops the app.

## Project structure

- `public/pages/` contains one independent module per navigation tab.
- `public/components/` contains small shared interface components.
- `public/styles/` contains shared visual design rules.
- `server.js` serves the app from your computer.
- `launch-app.ps1` starts the app and creates its temporary internet link.

To add a mini project, create a module in `public/pages/`, then register it in `public/app.js`.

## Security note

The public URL is temporary and changes each time the launcher starts. Anyone with that URL can open the app while it is running, so do not put private information in it.
