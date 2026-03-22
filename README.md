# Mental Addition Trainer 🧠

A web-based interactive "Mental Addition Trainer" game. It displays a sequence of numbers in a circular layout, asks the player to start adding from a specific highlighted number, and tracks the correctness and time taken for their answers.

This project was originally written in Python with a terminal interface and was ported into a modern, dynamic web app using HTML, CSS, and Vanilla JavaScript.

## 🚀 How to Run

Since the application uses standard web technologies, there are no complicated build steps or dependencies. You can simply open it in your browser!

### Option 1: Direct File
Just double-click on the `index.html` file to open it in your default web browser (Chrome, Firefox, Safari, Edge, etc.).

### Option 2: Local Web Server
If you prefer running it on a local server (recommended if you expand the app with external API requests later):
1. Open your terminal in this directory.
2. Run a simple Python server: 
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser.

---

## 🛠️ Project Structure

- `index.html`: The main skeletal structure of the web app. Includes the font links and links to our CSS and JS.
- `styles.css`: All the styling rules. It uses a modern "glassmorphism" aesthetic with a glowing dark mode theme.
- `script.js`: The core game logic. It manages state (current level, numbers, score), renders the UI dynamically by injecting HTML into the `#app` div, and handles user inputs and timing.
- `addition_trainer.py`: The original Python script that inspired this web app.

---

## 🎨 How to Tweak & Customize

This project was built to be easily customizable. Here are a few things you might want to tweak:

### 1. Modifying the Game Levels & Difficulty (`script.js`)

At the very top of `script.js`, you'll find the `LEVELS` object. You can add new levels or tweak the existing ones:

```javascript
const LEVELS = {
    // level_id: { count: how many numbers, max_val: max random number, start_points: how many rounds }
    0: { count: 4, max_val: 20, start_points: 2 },
    1: { count: 10, max_val: 20, start_points: 2 },
    // ... add more levels here!
    6: { count: 15, max_val: 200, start_points: 5 } // Example of a new extreme level
};
```

### 2. Changing the Theme & Colors (`styles.css`)

The app uses CSS Variables for easy color theming. Open `styles.css` and look at the `:root` block at the top:

```css
:root {
  --bg-dark: #09090b;       /* Main background color */
  --primary: #6366f1;       /* Indigo primary color */
  --secondary: #a855f7;     /* Purple secondary color */
  --accent: #ec4899;        /* Pink accent color */
  --success: #10b981;       /* Green for correct answers */
  --error: #ef4444;         /* Red for incorrect answers */
}
```
Try changing these HEX values to completely alter the vibe to a "Matrix Green" theme, a "Cyberpunk" theme, or a "Light Theme"!

### 3. Adjusting the Circular Layout (`script.js`)

In `script.js`, there's a function called `renderCircle(nums, currentStartPoint)`.
If you want the circle to be larger or smaller, you can change the `radius` variable inside that function:

```javascript
function renderCircle(nums, currentStartPoint) {
    // ...
    const radius = 130; // Increase this to make the circle wider
    // ...
}
```

## Enjoy playing and building!
# Addition-Trainer
