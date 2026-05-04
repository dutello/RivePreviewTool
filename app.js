(() => {
  const { Rive, Layout, Fit, Alignment } = window.rive;

  const canvas = document.getElementById("rive-canvas");
  const resizable = document.getElementById("resizable");
  const stage = document.getElementById("stage");
  const fileInput = document.getElementById("file-input");
  const fileNameLabel = document.getElementById("file-name");
  const sizeReadout = document.getElementById("size-readout");
  const fitSelect = document.getElementById("fit-select");
  const scaleSlider = document.getElementById("scale-slider");
  const scaleReadout = document.getElementById("scale-readout");
  const scaleControl = document.getElementById("scale-control");
  const dragRight = document.getElementById("drag-right");
  const dropHint = document.getElementById("drop-hint");
  const layoutNote = document.getElementById("layout-note");
  const presetButtons = document.querySelectorAll(".preset-btn");

  const FIT_MAP = {
    layout: Fit.Layout,
    contain: Fit.Contain,
    cover: Fit.Cover,
    fitWidth: Fit.FitWidth,
    fitHeight: Fit.FitHeight,
    fill: Fit.Fill,
    scaleDown: Fit.ScaleDown,
    none: Fit.None,
  };

  let riveInstance = null;
  let currentBuffer = null;

  function buildLayout() {
    const fit = FIT_MAP[fitSelect.value] ?? Fit.Layout;
    const layoutScaleFactor = parseFloat(scaleSlider.value) || 1;
    return new Layout({ fit, alignment: Alignment.Center, layoutScaleFactor });
  }

  function updateLayoutControlsVisibility() {
    const isLayout = fitSelect.value === "layout";
    scaleControl.style.display = isLayout ? "" : "none";
    layoutNote.style.display = isLayout ? "" : "none";
  }

  function updateSizeReadout() {
    const w = Math.round(resizable.clientWidth);
    const h = Math.round(resizable.clientHeight);
    sizeReadout.textContent = `${w} × ${h}`;
  }

  function syncRiveSize() {
    if (!riveInstance) return;
    riveInstance.resizeDrawingSurfaceToCanvas();
  }

  function loadBuffer(buffer, name) {
    if (riveInstance) {
      riveInstance.cleanup();
      riveInstance = null;
    }
    currentBuffer = buffer;
    if (name) fileNameLabel.textContent = name;
    dropHint.style.display = "none";

    riveInstance = new Rive({
      buffer,
      canvas,
      autoplay: true,
      autoBind: true,
      layout: buildLayout(),
      onLoad: () => {
        // Auto-pick a state machine if the file has one; otherwise play the default animation.
        try {
          const sms = riveInstance.stateMachineNames || [];
          if (sms.length > 0) riveInstance.play(sms[0]);
        } catch (_) {}
        riveInstance.resizeDrawingSurfaceToCanvas();
      },
    });
  }

  // --- File input ---
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    loadBuffer(buffer, file.name);
  });

  // --- Drag & drop ---
  ["dragenter", "dragover"].forEach((evt) => {
    stage.addEventListener(evt, (e) => {
      e.preventDefault();
      stage.classList.add("drag-over");
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    stage.addEventListener(evt, (e) => {
      if (evt === "dragleave" && e.target !== stage) return;
      e.preventDefault();
      stage.classList.remove("drag-over");
    });
  });
  stage.addEventListener("drop", async (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".riv")) return;
    const buffer = await file.arrayBuffer();
    loadBuffer(buffer, file.name);
  });

  // --- Fit selector (rebuilds layout; needs new layout on the instance) ---
  fitSelect.addEventListener("change", () => {
    updateLayoutControlsVisibility();
    if (!riveInstance) return;
    riveInstance.layout = buildLayout();
    riveInstance.resizeDrawingSurfaceToCanvas();
  });

  // --- Layout scale slider (only meaningful in Fit.Layout mode) ---
  scaleSlider.addEventListener("input", () => {
    scaleReadout.textContent = `${parseFloat(scaleSlider.value).toFixed(2)}×`;
    if (!riveInstance) return;
    riveInstance.layout = buildLayout();
    riveInstance.resizeDrawingSurfaceToCanvas();
  });

  // --- Preset width buttons ---
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.width;
      if (value === "full") {
        const stagePadding = 64; // 32px each side
        resizable.style.width = `${stage.clientWidth - stagePadding}px`;
      } else {
        resizable.style.width = `${value}px`;
      }
      presetButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // --- Custom right-edge drag handle ---
  let dragState = null;
  dragRight.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragRight.setPointerCapture(e.pointerId);
    resizable.classList.add("dragging");
    dragState = {
      startX: e.clientX,
      startWidth: resizable.clientWidth,
    };
  });
  dragRight.addEventListener("pointermove", (e) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const newWidth = Math.max(32, dragState.startWidth + dx);
    resizable.style.width = `${newWidth}px`;
    presetButtons.forEach((b) => b.classList.remove("active"));
  });
  const endDrag = (e) => {
    if (!dragState) return;
    dragState = null;
    resizable.classList.remove("dragging");
    if (e.pointerId != null && dragRight.hasPointerCapture(e.pointerId)) {
      dragRight.releasePointerCapture(e.pointerId);
    }
  };
  dragRight.addEventListener("pointerup", endDrag);
  dragRight.addEventListener("pointercancel", endDrag);

  // --- Resize observer: keeps Rive's drawing surface in sync ---
  const ro = new ResizeObserver(() => {
    updateSizeReadout();
    syncRiveSize();
  });
  ro.observe(resizable);

  // Initial state
  updateSizeReadout();
  updateLayoutControlsVisibility();
  scaleReadout.textContent = `${parseFloat(scaleSlider.value).toFixed(2)}×`;
})();
