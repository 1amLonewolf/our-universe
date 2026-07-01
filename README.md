# Our Universe 🌌 (Marsden & Beatrice)

A personalized, cinematic, and interactive digital love story built with smooth animations, hardware-accelerated rendering, ambient audio, and a custom chatbot companion.

---

## ✨ Features

- **🛸 Celestial Orbit Map**: Float through the planetary deck containing sectors of your universe: timeline, memory gallery, compatibility scanner, and a restricted mission report.
- **💬 Cosmic AI Companion**: A futuristic chat interface with typing effects, styled dynamically to answer specific questions about Marsden and Beatrice's start date, first phone call, weekend plans, and more.
- **💞 Compatibility Analyzer**: A deep heart-sync scanner simulating real-time metric calibrations and overall orbit alignment calculation.
- **❤️ Constellation Deck**: Interactive glowing heart constellation revealing special facts on click.
- **🎵 Ambient Synthesizer**: Web Audio API ambient tone pad and chime effects to provide a warm space atmosphere.
- **✉️ Polaris Easter Egg**: Click the secret Polaris star 5 times in the header to unlock a handwritten wax-sealed letter.

---

## ⚡ Performance Optimizations

This website has been optimized to maintain a locked **60 FPS** rendering standard:
1. **Compositing Clean-up**: Restored GPU memory boundaries by removing unnecessary `will-change` definitions, avoiding compositor layer explosion.
2. **Backdrop-Filter Tuning**: Replaced heavy live-blur calculations under moving canvas components with high-opacity backdrop overlays.
3. **Canvas Draw Grouping**: Consolidated rendering fill styles using pre-calculated `rgba` alpha strings rather than changing global context states per star.
4. **Visibility Listener**: Pauses canvas star animation automatically when the tab is backgrounded.
5. **DOM Reflow Reduction**: Throttled scroll offsets in the chatbot companion typing loop to prevent layout engine thrashing.

---

## 🚀 How to Run Locally

Since this project consists of pure static client-side files, it has no dependencies or build steps:

1. **Direct Open**: You can simply double-click the `index.html` file to open it in any web browser.
2. **Local Server (Recommended)**: To ensure smooth loading of audio features (which some browsers restrict on the `file://` protocol), run a quick local server.
   - If you have **Node.js** installed, run:
     ```bash
     npx serve .
     ```
   - If you have **Python** installed, run:
     ```bash
     python -m http.server 8000
     ```
     Then navigate to `http://localhost:8000`.

---

## 🌐 Deploying to GitHub Pages

GitHub Pages is a free hosting service that allows you to deploy this static website directly from your repository.

### Step 1: Upload Your Repository to GitHub
Ensure your repository files are placed at the root level of your GitHub repository in the following structure:
```text
your-repository/
├── index.html
├── README.md
└── assets/
    ├── favorite_conversation.jpg
    ├── first_hug.jpg
    ├── laughing_together.jpg
    └── unforgettable_day.jpg
```
*Note: Casing on GitHub Pages is case-sensitive. File names in the `assets/` directory are written in lowercase to match references inside `index.html` perfectly.*

### Step 2: Enable GitHub Pages
1. Go to your repository page on **GitHub**.
2. Click on the **Settings** tab (the gear icon at the top).
3. Under **Code and automation** in the sidebar, click on **Pages**.
4. Under the **Build and deployment** settings:
   - Set **Source** to `Deploy from a branch`.
   - Set **Branch** to your primary branch (e.g., `main` or `master`).
   - Set the folder dropdown to `/ (root)`.
5. Click **Save**.

### Step 3: Access Your Universe
GitHub will start building the page. Within 1–2 minutes, a banner will appear at the top of the **Pages** settings screen showing your live URL:
`https://<your-username>.github.io/<your-repo-name>/`
# our-universe
