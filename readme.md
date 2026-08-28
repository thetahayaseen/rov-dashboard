# Aurov — Underwater ROV Dashboard

A dashboard for an underwater ROV — live video feed, real-time detection of whatever the ROV spots underwater, and a full archive of past dives with snapshots and timestamps.

Started as a hackathon project, now getting the polish it deserves.

## What it does

- **Live streaming** — watch the ROV's feed in real time over SignalR
- **Live detection** — items get checked off a live checklist as they're spotted, snapshots show up as they happen
- **Past streams** — every dive gets recorded and archived with its full detection history, paginated so it doesn't turn into a wall of cards
- **Snapshot gallery** — click any thumbnail to pull up the full set for that stream
- **Dark UI** — built it the way I'd actually want to stare at a screen for hours

## Stack

- ASP.NET Core Web API
- SignalR (two hubs — one for stream lifecycle, one for detected items)
- SQLite + EF Core
- Razor Views, Tailwind, vanilla JS — no framework bloat

## How it actually works

1. Stream starts → backend fires a `StreamStarted` event over SignalR with the feed URL and the labels the system's watching for.
2. ROV detects something → `NewItemDetected` fires, checklist updates, snapshot drops into the live feed.
3. Stream ends → everything gets saved (recording, snapshots, full detection timeline) and lands in Past Streams.
4. Past Streams is paginated, 10 per page. Each card's got the recording, a snapshot grid, and the detection log — click a thumbnail, get the full gallery.

## Running it

```bash
# restore dependencies
dotnet restore
npm install

# build Tailwind
npx tailwindcss -i ./wwwroot/css/input.css -o ./wwwroot/css/output.css --watch

# run it
dotnet run
```

### No ROV? Use the simulator

`capture.py` fakes the whole pipeline using your webcam, so you can build/test without the actual hardware:

```bash
python capture.py
```

Console commands once it's running:

- `start` — kicks off a stream (webcam + recording)
- `x <label>` — logs a fake detection (e.g. `x fish`)
- `stop` — ends the current stream
- `end` — quits the simulator

Dashboard updates live as it runs, same as it would with the real thing.

## Structure

```
Controllers/    API + view controllers
Hubs/           SignalR hubs
Models/         EF Core entities, view models, request DTOs
Repositories/   Data access layer
Views/          Razor views
wwwroot/        Compiled CSS, client-side JS
Migrations/     EF Core migrations
Simulation/     capture.py — webcam-based stand-in for the real ROV,
                lets me build and test the whole pipeline without hardware
```

## Status

Actively building. Dashboard and real-time detection pipeline work end to end — still tightening things up as I go.
