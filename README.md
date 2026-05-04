# Rive Preview

A simple static web app for previewing `.riv` files at any container width — built to demo to engineers how a Rive animation responds to its container.

## Run

From this directory, start any static server:

```sh
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000`.

## Use

- **Load a file** — click *Choose .riv file*, or drag-and-drop a `.riv` onto the stage.
- **Resize the container** — drag the right edge handle, drag the bottom-right corner (width + height), or click a width preset (320 / 375 / 414 / 768 / 1024 / Full).
- **Switch fit modes** — the *Fit* dropdown changes how the Rive artwork fills the container (`Layout` is the responsive Rive-layout mode; `Contain`, `Cover`, etc. are static fits).
- The current container size is shown in the top-right.
