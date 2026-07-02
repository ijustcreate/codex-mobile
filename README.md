# Codex Mobile

A clean, modular web app that runs on your machine and can be opened from a phone through a temporary public link.

## GitHub Pages

This project can also run as a static GitHub Pages site from the `public/` folder. In static mode, sign-in and Tab One creations use browser `localStorage`; Node-only server APIs are available only when running locally.

## Launch

Double-click **Launch Codex Mobile.bat**. Your browser opens the local app automatically. The launcher window prints a `trycloudflare.com` public URL that you can share with any device. It does not require a tunnel password.

Keep the launcher window open while using either link. Closing it stops the app.

## Project structure

- `public/pages/` contains one independent module per navigation tab.
- `public/components/` contains small shared interface components.
- `public/styles/` contains shared visual design rules.
- `server.js` serves the app from your computer.
- `launch-app.ps1` starts the app and creates its temporary internet link.
- `user-data/` contains one readable folder per registered user.

To add a mini project, create a module in `public/pages/`, then register it in `public/app.js`.

## Security note

The public URL is temporary and changes each time the launcher starts. Visitors must create an account or sign in. Passwords are securely hashed, but this lightweight app is intended for personal projects rather than sensitive or regulated information.
