# Electron desktop app, not a web app

The app embeds a terminal and writes files, so a web build needs a localhost server exposing a shell, which any page or extension reaching localhost could abuse. Electron keeps PTY, agents, and file access in one Node main process, and the Claude Agent SDK is Node-native. Tauri was rejected: Rust PTY plus a Node sidecar means two runtimes.
