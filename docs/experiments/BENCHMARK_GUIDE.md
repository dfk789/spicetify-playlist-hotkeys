# Playlist API Benchmark Guide

**Status**: Benchmark extension built and ready ✅
**Purpose**: Measure current playlist performance to inform Phase 4 optimizations
**Time Required**: ~2-5 minutes per test

---

## 🎯 What Gets Benchmarked

### Test Suite

| Test | Measures | Informs |
|------|----------|---------|
| **Playlist Fetch** | Time to get all user playlists | Baseline API latency |
| **Duplicate Detection** | Scanning playlist for existing track | Pre-scan performance |
| **Track Addition** | Single add operation latency | API write speed |
| **Batch Operations** | Adding to multiple playlists | Concurrent performance |
| **Large Playlist Scan** | Scan 1000+ track playlist | Pagination overhead |

### Performance Metrics

- **Duration**: Milliseconds per operation
- **Throughput**: Items processed per second
- **Item Count**: Number of tracks/playlists processed
- **Comparative**: Fastest vs slowest operations

---

## 🚀 Setup Instructions

### Step 1: Copy Benchmark Extension

**Windows (PowerShell)**:
```powershell
Copy-Item dist\playlist-benchmark.js "$env:APPDATA\spicetify\Extensions\playlist-benchmark.js"
```

**macOS/Linux**:
```bash
EXT_PATH=$(spicetify path | grep Extensions | cut -d: -f2- | xargs)
cp dist/playlist-benchmark.js "$EXT_PATH/playlist-benchmark.js"
```

### Step 2: Enable Extension

```bash
spicetify config extensions playlist-benchmark.js
spicetify apply
```

Wait for Spotify to restart...

### Step 3: Verify Installation

When Spotify opens, you should see:
- Notification: "📊 Benchmark Tool Loaded"

Open DevTools (`Ctrl+Shift+I` or `Cmd+Opt+I`) and check console for:
```
[PlaylistBenchmark] Extension loaded
Available commands:
  PlaylistBenchmark.run() - Quick benchmark (playlist fetch only)
  ...
```

---

## 📊 Running Benchmarks

### Quick Test (Recommended First Run)

**Purpose**: Test basic functionality without modifying playlists

```javascript
// In Spotify DevTools console
PlaylistBenchmark.run()
```

**What it does**:
- Fetches all your playlists
- Measures fetch time
- Shows results in notification + console

**Expected output**:
```
📊 Benchmark Complete!
1 tests in XXXms
Check console for details
```

### Full Benchmark Suite

**Prerequisites**:
- ✅ Track currently playing in Spotify
- ✅ You own at least one playlist (for write tests)
- ✅ Playlist URI (see "Getting Playlist URI" below)

```javascript
// Replace with your playlist URI
PlaylistBenchmark.runFull("spotify:playlist:YOUR_PLAYLIST_ID")
```

**What it does**:
1. Fetches all playlists
2. Scans test playlist for duplicates
3. Adds current track (then removes it)
4. Scans large playlist (if 1000+ tracks)
5. Shows comprehensive report

**⚠️ Note**: This test **temporarily adds** the current track to your playlist, then immediately removes it. Choose a test playlist you don't mind modifying.

---

## 🔍 Getting Playlist URI

### Method 1: Spotify Desktop App

1. Right-click any playlist
2. Click "Share" → "Copy Spotify URI"
3. Result: `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`

### Method 2: Web Player

1. Open playlist in Spotify web player
2. Copy URL: `https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M`
3. Extract ID: `37i9dQZF1DXcBWIGoYBM5M`
4. Format as URI: `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`

### Method 3: Console

```javascript
// Get URI of currently viewing playlist
Spicetify.Platform.History.location.pathname
// Example output: /playlist/37i9dQZF1DXcBWIGoYBM5M
```

---

## 🧪 Individual Test Commands

Run specific tests separately:

```javascript
// Test 1: Fetch all playlists
await PlaylistBenchmark.fetchPlaylists()

// Test 2: Check duplicates in specific playlist
await PlaylistBenchmark.checkDuplicates("spotify:playlist:YOUR_ID")

// Test 3: Add current track (then remove)
await PlaylistBenchmark.addTrack("spotify:playlist:YOUR_ID")

// Test 4: Batch add to multiple playlists
await PlaylistBenchmark.batchAdd([
  "spotify:playlist:PLAYLIST_1",
  "spotify:playlist:PLAYLIST_2",
  "spotify:playlist:PLAYLIST_3"
])

// Test 5: Scan large playlist (1000+ tracks)
await PlaylistBenchmark.largeScan("spotify:playlist:YOUR_LARGE_PLAYLIST_ID")
```

---

## 📈 Interpreting Results

### Console Output

```javascript
📊 Playlist API Benchmark Results
Timestamp: 10/24/2025, 3:45:30 PM
Total Tests: 5
Total Duration: 1234.56ms
Fastest: Playlist Fetch (All) (123ms)
Slowest: Large Playlist Full Scan (890ms)

Detailed Results:
┌─────────────────────────────────┬──────────────┬────────┬─────────────────────┐
│ Test                            │ Duration (ms)│ Items  │ Throughput (items/s)│
├─────────────────────────────────┼──────────────┼────────┼─────────────────────┤
│ Playlist Fetch (All)            │ 123.45       │ -      │ -                   │
│ Fetch Playlist Tracks           │ 234.56       │ -      │ -                   │
│ Duplicate Check (In Playlist)   │ 12.34        │ 150    │ 12157.89            │
│ Add Track to Playlist           │ 345.67       │ -      │ -                   │
│ Large Playlist Full Scan        │ 890.12       │ 1523   │ 1711.22             │
└─────────────────────────────────┴──────────────┴────────┴─────────────────────┘
```

### Key Metrics to Note

**1. Playlist Fetch**
- Baseline: ~100-300ms (normal)
- > 500ms: Network issues or large library

**2. Duplicate Check**
- Throughput: 10,000+ items/s (JavaScript array scan)
- Low throughput: Large playlists or slow device

**3. Track Addition**
- Single add: ~200-400ms (API latency)
- > 1000ms: Network or rate limiting

**4. Large Playlist Scan**
- Throughput: 1000-3000 items/s (API pagination)
- Lower = more network overhead

**5. Batch Operations**
- Should be faster than serial (parallel execution)
- Watch for rate limiting (429 errors)

---

## 🎯 What To Look For

### Phase 4 Optimization Targets

Based on benchmark results:

**If duplicate check is slow** (< 5000 items/s):
- Consider optimistic add (skip pre-scan)
- Use API duplicate errors instead
- Trade-off: Lose linked track detection

**If large playlist scan is slow** (< 1000 items/s):
- Pagination overhead is significant
- Cache more aggressively
- Consider partial scans

**If batch operations are slow**:
- May be hitting rate limits
- Add throttling/delays
- Implement request queuing

**If track addition varies widely**:
- Network inconsistency
- Consider retry logic
- Show loading indicators

---

## 📝 Documenting Results

### Create Results File

Copy this template to `docs/experiments/benchmark-results.md`:

```markdown
# Playlist API Benchmark Results

**Date**: 2025-10-24
**Platform**: Windows 11 / macOS 14 / Linux (Ubuntu 22.04)
**Spotify Version**: [Check Help > About Spotify]
**Network**: Wi-Fi / Ethernet / Mobile
**Playlist Count**: [Your total playlists]

## Test Environment
- Library size: ~XXX playlists
- Test playlist size: ~XXX tracks
- Large playlist size: ~XXXX tracks
- Network latency: ~XXms to spotify.com

## Quick Benchmark Results

\`\`\`
[Paste console output from PlaylistBenchmark.run()]
\`\`\`

## Full Benchmark Results

\`\`\`
[Paste console output from PlaylistBenchmark.runFull(...)]
\`\`\`

## Analysis

### Performance Observations
- Fastest operation: [...]
- Slowest operation: [...]
- Bottleneck identified: [...]

### Optimization Recommendations
1. [Based on results...]
2. [...]

### Notes
[Any issues, anomalies, or platform-specific behaviors]
```

---

## 🧹 Cleanup

### After Benchmarking

```bash
# Remove extension
spicetify config extensions playlist-benchmark.js-
spicetify apply
```

### Clear Results

```javascript
// In console (before removing extension)
PlaylistBenchmark.reset()
```

---

## 🔧 Utility Commands

```javascript
// View current results
PlaylistBenchmark.results()

// Enable debug logging
PlaylistBenchmark.debug(true)

// Disable debug logging
PlaylistBenchmark.debug(false)

// Reset and start fresh
PlaylistBenchmark.reset()
```

---

## ⚠️ Troubleshooting

### Extension not loading
```bash
# Check if registered
spicetify config | grep benchmark

# Re-enable if missing
spicetify config extensions playlist-benchmark.js
spicetify apply
```

### "No track playing" error
- Start playback of any track
- Make sure track is fully loaded

### "Benchmark failed" errors
- Check DevTools console for details
- Verify playlist URI format
- Ensure you own the test playlist
- Check network connection

### Rate limiting (429 errors)
- Wait 30-60 seconds
- Reduce batch size
- Run tests individually with delays

---

## 📊 Expected Performance Baselines

Based on research and typical Spicetify extension performance:

| Operation | Good | Acceptable | Slow |
|-----------|------|------------|------|
| Playlist Fetch | < 200ms | 200-500ms | > 500ms |
| Duplicate Check (100 tracks) | < 10ms | 10-50ms | > 50ms |
| Track Addition | < 300ms | 300-600ms | > 600ms |
| Large Scan (1000 tracks) | < 1000ms | 1-2s | > 2s |
| Batch (5 playlists) | < 500ms | 500-1500ms | > 1500ms |

**Note**: These are estimates. Your results will vary based on network, Spotify server load, and library size.

---

## 🎯 Next Steps After Benchmarking

1. Document results in `benchmark-results.md`
2. Identify optimization opportunities
3. Compare against Phase 4 optimization goals
4. Document findings in a GitHub Issue comment or durable doc
5. Prioritize Phase 4 tasks based on bottlenecks

---

## 💡 Tips

- **Run multiple times**: Network variance affects results
- **Test during off-peak**: More consistent measurements
- **Use test playlist**: Don't use important playlists
- **Compare platforms**: Results may vary Windows/Mac/Linux
- **Document anomalies**: Unexpected results are valuable data

The benchmarks will guide Phase 4 optimization decisions! 🚀
