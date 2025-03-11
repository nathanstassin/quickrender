# QuickRender

A simple yet powerful script to streamline your rendering workflow in Adobe After Effects. Save time with composition-specific settings and one-click rendering!

---

## Features ✨

- **Single-Click Rendering ▶️**  
  Render your comp instantly with saved settings.

- **Save Settings Per Composition 💾**  
  No more reconfiguring after each revision!

- **Quick Stills 📸**  
  Capture TIFF stills (with alpha) at the playhead position.

- **Template Support 🔽**  
  Use existing output module templates.

- **Smart UI 🖥️**  
  Auto-resizes, remembers your output path, and refreshes when the window is clicked.

---

## Installation 🛠️

### Windows

1. **Locate Scripts Folder:**  
   Navigate to:  
   `C:\Program Files\Adobe\Adobe After Effects [Your Version]\Support Files\Scripts\ScriptUI Panels`

2. **Add Script:**  
   Place `QuickRender.jsx` in the **ScriptUI Panels** subfolder.

3. **Restart AE:**  
   Find the script under **Window > QuickRender**.

### macOS

1. **Locate Scripts Folder:**  
   Go to:  
   `/Applications/Adobe After Effects [Your Version]/Scripts/ScriptUI Panels`

2. **Add Script:**  
   Place `QuickRender.jsx` in the **ScriptUI Panels** subfolder.

3. **Restart AE:**  
   Access via **Window > QuickRender**.

> 💡 **Note:** Enable "Allow Scripts to Write Files" in AE Preferences  
> **(Edit > Preferences > Scripting & Expressions)**.

---

## Usage 🎮

### Set Up

- Open your composition.
- Click **📂 Select Render Path** to choose an output folder.
- Select a template from the dropdown.

### Save Settings

- Click **💾 Save Settings** to store the template/path for this comp.

### Render

- **Full Render:**  
  Click **▶️ Render** to render using saved work area settings.
- **Still Render:**  
  Move the playhead, then click **📸 Render Still at Playhead**.

---

## Known Limitations ⚠️

- Frame numbering in filenames uses `[#####]` by default (see TODO in code).
- Requires at least one output template to exist in AE.

---

## Contributing & Feedback 🤝

I welcome suggestions! Found a bug? Have a feature idea?  
Pull requests are encouraged—let's make this tool even better together.

---

**Happy Rendering! 🚀**
