# Claude Agents — Referensi Lengkap

> Panduan semua skill, agent, dan tools yang tersedia di setup ini.

---

## Slash Commands (Skills)

Ketik langsung di prompt Claude Code.

### Code Quality

| Command | Fungsi |
|---------|--------|
| `/code-review` | Review diff kode yang berubah — temukan bug & cleanup |
| `/code-review ultra` | Deep review multi-agent di cloud (paling menyeluruh) |
| `/code-review ultra <PR#>` | Review GitHub PR spesifik |
| `/code-review --fix` | Review + langsung apply perbaikan ke kode |
| `/simplify` | Review + apply cleanup: reuse, efisiensi, simplifikasi |
| `/security-review` | Audit keamanan semua perubahan di branch |

### Running & Testing

| Command | Fungsi |
|---------|--------|
| `/run` | Launch app, screenshot hasilnya, cek perubahan berjalan |
| `/verify` | Jalankan app dan observasi behavior untuk konfirmasi fix |

### Research

| Command | Fungsi |
|---------|--------|
| `/deep-research <topik>` | Riset mendalam multi-sumber dengan fact-checking & sitasi |

### Browser Automation

| Command | Fungsi |
|---------|--------|
| `/claude-in-chrome` | Automate Chrome: klik, isi form, screenshot, baca console |

### Project Setup

| Command | Fungsi |
|---------|--------|
| `/init` | Generate CLAUDE.md baru untuk dokumentasi project |
| `/review` | Review GitHub Pull Request |

### Scheduling & Automation

| Command | Fungsi |
|---------|--------|
| `/loop <interval> <cmd>` | Jalankan command berulang (contoh: `/loop 5m /verify`) |
| `/schedule` | Buat cloud agent terjadwal dengan cron |

### Config

| Command | Fungsi |
|---------|--------|
| `/update-config` | Update settings.json, permissions, hooks otomatis |
| `/keybindings-help` | Kustomisasi keyboard shortcuts |
| `/fewer-permission-prompts` | Scan transcript, tambah allowlist otomatis |
| `/claude-api` | Referensi Claude API & Anthropic SDK |

---

## Agent Types

Dipakai otomatis oleh Claude, atau bisa diminta eksplisit.

| Agent | Kapan Dipakai |
|-------|---------------|
| `Explore` | Cari file, simbol, atau keyword — cepat & read-only |
| `Plan` | Rancang strategi implementasi sebelum coding |
| `general-purpose` | Task multi-step kompleks umum |
| `ui-research-specialist` | Research UI trends, library, component patterns modern |
| `claude-code-guide` | Tanya tentang fitur Claude Code itu sendiri |
| `claude` | Default catch-all untuk semua task |

**Cara request eksplisit:**
```
"Explore semua API routes di folder app/api"
"Plan cara refactor auth middleware, jangan implement dulu"
"Research library terbaik untuk date picker di 2025"
```

---

## MCP Servers (Integrasi Eksternal)

### Browser Automation

| Tool | Fungsi |
|------|--------|
| Chrome — navigate | Buka URL di tab baru |
| Chrome — computer | Klik, scroll, interaksi halaman |
| Chrome — read_page | Baca konten halaman |
| Chrome — form_input | Isi form otomatis |
| Chrome — read_console_messages | Baca console log (debug JS) |
| Chrome — read_network_requests | Inspect network requests |
| Chrome — gif_creator | Rekam interaksi jadi GIF |
| Chrome — javascript_tool | Eksekusi JS di halaman |

### Google Workspace

| Tool | Fungsi |
|------|--------|
| Gmail | Baca thread, buat draft, search, label email |
| Google Calendar | Buat/update event, cek jadwal, suggest waktu rapat |
| Google Drive | Upload, download, search, baca file |

### Produktivitas

| Tool | Fungsi |
|------|--------|
| Slack | Kirim pesan, baca channel/thread, search, buat canvas |
| Notion | Buat/update page, search, query database |

### Development

| Tool | Fungsi |
|------|--------|
| `ide__executeCode` | Eksekusi kode di IDE |
| `ide__getDiagnostics` | Ambil error/warning dari IDE |
| `zread__get_repo_structure` | Baca struktur repo |
| `zread__read_file` | Baca file dari repo |
| `zread__search_doc` | Search di dokumentasi |
| `web-reader` | Fetch & baca konten halaman web |
| `web-search-prime` | Web search |

### Visual AI (zai-mcp-server)

| Tool | Fungsi |
|------|--------|
| `analyze_image` | Analisa & jelaskan gambar |
| `analyze_video` | Analisa konten video |
| `analyze_data_visualization` | Baca & interpretasi chart/grafik |
| `diagnose_error_screenshot` | Diagnosa error dari screenshot |
| `extract_text_from_screenshot` | OCR — ekstrak teks dari screenshot |
| `ui_diff_check` | Bandingkan dua tampilan UI (before/after) |
| `ui_to_artifact` | Convert screenshot UI jadi kode |
| `understand_technical_diagram` | Baca diagram teknis (ERD, flowchart, dsb) |

---

## Workflow (Multi-Agent Orchestration)

Untuk task skala besar yang butuh banyak agen paralel.

**Cara trigger:**
```
"use a workflow to..."
"fan out agents to..."
"orchestrate this with subagents..."
```

**Pola umum:**

| Pola | Contoh Penggunaan |
|------|-------------------|
| Parallel review | "Review semua API routes untuk security issues secara paralel" |
| Find → Verify | "Cari semua bug lalu verify masing-masing secara independen" |
| Pipeline | "Audit tiap file: scan → analyze → fix" |
| Loop-until-done | "Terus cari bug sampai tidak ada yang baru ditemukan" |

---

## Contoh Prompt yang Berguna

```bash
# Research
/deep-research "best practices for JWT refresh token rotation 2025"

# Review mendalam sebelum push
/code-review ultra

# Konfirmasi fitur berjalan
/verify

# Debug via screenshot
# → paste screenshot error, tulis: "diagnose error ini"

# Bandingkan UI
# → paste 2 screenshot, tulis: "ui_diff_check, ada yang berubah?"

# Cari file
"Explore semua file yang berhubungan dengan auth"

# Plan dulu sebelum coding
"Plan cara implementasi notifikasi real-time, jangan coding dulu"

# Loop testing
/loop 5m /verify

# Security audit
/security-review
```

---

## Tips

- **Minta paralel** → `"cek semua route ini secara paralel"`
- **Minta plan dulu** → `"plan dulu, jangan implement"`
- **Minta comprehensive** → `"be thorough"` atau `"audit secara menyeluruh"`
- **Untuk fix otomatis** → tambahkan `--fix` di code-review
- **Untuk review paling dalam** → `/code-review ultra`
