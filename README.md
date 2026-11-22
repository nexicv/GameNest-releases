# GameNest

GameNest is a free multiplayer and solo game hub where one player hosts a lobby, picks a game, and everyone joins from the same app—either with a six-character join code through the GameNest relay, or directly over a local network (LAN) or Tailscale.

- **Website & downloads:** [gamenest.info](https://gamenest.info/)
- **How to play:** [gamenest.info/how-to-play.html](https://gamenest.info/how-to-play.html)
- **FAQ:** [gamenest.info/faq.html](https://gamenest.info/faq.html)
- **Support:** [gamenest.info/support.html](https://gamenest.info/support.html) · [Discord](https://discord.gg/EXssq55utK)
- **Privacy:** [gamenest.info/privacy.html](https://gamenest.info/privacy.html)

This repository holds public release binaries and game packages for GameNest. GameNest is closed-source software offered free to download; the source repository stays private.

---

## Downloads & installation

Pick the latest build for your system from [Releases](https://github.com/nexicv/GameNest-releases/releases). No Rust or Python installation is required to run packaged builds.

- **Windows (64-bit):** Download `GameNest-v<version>-windows.zip`, extract it, and open `GameNest.exe`. (`GameNest-v<version>.zip` contains only the executable and is used by the in-app updater.)
- **Linux (x86-64):** Download `GameNest-v<version>-linux-x86_64.tar.gz`, extract the folder, and run `./GameNest`. Requires **glibc 2.35 or newer** (Ubuntu 22.04+, Debian 12+, Fedora 36+) and an X11 or Wayland desktop.
- **macOS (Apple silicon and Intel):** Download `GameNest-v<version>-macos-app.zip` and open `GameNest.app`. Because the app is not signed with an Apple Developer ID, allow it once in **System Settings → Privacy & Security → Open Anyway**. Settings and games are kept in `~/Library/Application Support/GameNest`.
- **Android:** Install `GameNest-v<version>-android.apk` (allow installing from your browser or file manager when prompted). Android builds can **both host and join** lobbies and bundle the built-in board/party games inside the app.
- **iPhone (unsigned preview):** There is no App Store build. `GameNest-v<version>-ios-unsigned.ipa` is join-only and must be signed with your own Apple ID (for example via AltStore or SideStore; a free Apple ID signature refreshes every 7 days). iOS builds do not self-update.

### Installing games

- **In-app catalog (recommended on Windows):** Open **Settings → Manage games** to install, update, or remove individual games, and install optional add-ons such as **Stockfish** for Chess.
- **Manual all-games fallback (`-games.zip`):** When the in-app catalog is unavailable on a platform or release (including Linux `0.11.6` and macOS `0.11.0`), download the matching platform `-games.zip` and extract it beside the GameNest executable (or into `~/Library/Application Support/GameNest` on macOS).
- **Board games vs. 3D games:** For board and party games, only the **host** needs the game installed—guests just need the GameNest app. For realtime 3D games such as **Practice Range**, each player installs a copy of the game package.

---

## Games included

| Game | Players | Modes & notes |
| --- | --- | --- |
| **Chess** | 1–2 | Local hot-seat, online, or optional **Stockfish 19** opponent (desktop add-on), automatic PGN history, and post-game analysis on Windows. |
| **Four in a Row** | 1–2 | 7×6 board — local, online, or built-in computer opponent. |
| **Checkers** | 1–2 | 8×8 English draughts with forced captures and kings. |
| **Gomoku** | 1–2 | 15×15 five-in-a-row. |
| **Battle of the Boats** | 1–2 | 10×10 hidden-fleet naval duel. |
| **Wall Duel** | 1–2 | 9×9 race across the board while placing walls. |
| **Backgammon** | 1–2 | Classic 24-point backgammon with dice, bar, and bearing off. |
| **Tic-Tac-Toe & Ultimate** | 1–2 | Classic 3×3 plus 9×9 Ultimate variant. |
| **Ludo** | 1–4 | 15×15 four-seat Ludo with home yards and captures. |
| **Snakes and Ladders** | 1–4 | Classic 10×10 board for up to four players. |
| **Jeopardy** | 2–16 | Host-judged 6×5 quiz board with buzzers and editable clue files (**Settings → Manage games → Tools**). |
| **Task Knockout** | 2–16 | Challenge-tile party board with customizable board size and editable task pools. |
| **Practice Range** *(Windows 3D preview)* | up to 10 | Round-based first-person shooter over LAN or Tailscale (buy phase, scoreboard, replays, bots). |

*Four in a Row, Battle of the Boats, and Wall Duel use original names for traditional games and are unofficial implementations. Desktop builds also include an offline zombie test map under **Manage games → Add-ons**.*

---

## Hosting & connecting

1. **Join code (internet play via relay):** Tick **Host through relay** before clicking **Host Game** (enabled automatically when tapping **Host on this phone** on Android). Share the six-character join code so friends can connect without port forwarding.
2. **Direct address (LAN or Tailscale):** Leave relay hosting off—or join directly even while relay hosting is on—by entering the host's IP address and port (`47631` by default). Direct joining works without depending on the relay.
3. **Realtime 3D exception:** A join code gets everyone into the lobby, but realtime 3D matches (such as Practice Range) connect directly to the host over an encrypted LAN or Tailscale connection.

Players on Windows, Linux, macOS, Android, and iOS can share the same lobby (for supported games), with live lobby ping readouts and disconnect/reconnect recovery.

---

## Updates, uninstalling & security notes

- **Official updates:** Use **Settings → Check for updates** (or download directly from [Releases](https://github.com/nexicv/GameNest-releases/releases)). Automatic startup update checks can be turned off in Settings.
- **Package verification:** Realtime 3D game packages (such as Practice Range) are cryptographically signed and verified by GameNest at install and before each launch. Board-game packs are not signed.
- **Optional Windows host-to-guest fallback:** When a Windows guest joins a newer Windows host, the host may offer its executable as an optional offline fallback. That host-to-guest update is **currently unsigned** (checked only against a hash sent by the same host)—choose **Later** and update from GitHub Releases unless you personally trust the host.
- **Uninstalling:** Desktop builds include **Uninstall GameNest** in Settings to remove the launcher, portable settings, caches, and installed game packages cleanly.

---

## Licensing & third-party notices

- **GameNest** is closed-source software offered free to download.
- Third-party open-source dependencies and assets are governed by their own licenses (see `THIRD_PARTY_NOTICES.txt` bundled with app downloads, `games/chess/ATTRIBUTION.md` for Chess piece artwork under CC BY-SA 3.0, and the optional Stockfish 19 add-on's `Copying.txt` + `stockfish-source.zip` under GPL-3.0-or-later).
