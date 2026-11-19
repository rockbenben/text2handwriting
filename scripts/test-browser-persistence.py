"""After npm run build, run with Python Playwright and installed Chromium.

Pass --chrome PATH to use a system Chrome instead of Playwright's Chromium.
"""

import argparse
import base64
import io
import json
import re
from statistics import median
import zipfile
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import expect, sync_playwright


TEXT_KEY = "text2handwriting_text_v1"


class StaticHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        worker = getattr(self.server, "replacement_worker", None)
        if worker is not None and self.path == "/sw.js":
            self.send_response(200)
            self.send_header("Content-Type", "text/javascript")
            self.end_headers()
            return io.BytesIO(worker)
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def translate_path(self, path):
        if path.split("?", 1)[0].startswith("/handwriting/"):
            path = path[len("/handwriting"):]
        return super().translate_path(path)

    def log_message(self, *args):
        pass


def saved_text(page):
    return page.evaluate("(key) => localStorage.getItem(key)", TEXT_KEY)


def editor(context, url):
    page = context.new_page()
    page.goto(url)
    expect(page.locator("textarea")).to_be_visible()
    return page


def set_standard_quality(page):
    page.get_by_role("button", name="Export", exact=True).click()
    quality = page.get_by_role("combobox", name="Quality")
    quality.select_option("1")
    quality.press("Escape")


def mobile_workspace(context, origin):
    page = context.new_page()
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(origin)
    draft = page.get_by_role("textbox", name="Document text")
    draft.fill("A draft on a small screen")
    more = page.get_by_role("button", name="More", exact=True)
    expect(page.get_by_role("button", name="Presets", exact=True)).to_be_hidden()
    more.click()
    expect(page.get_by_role("button", name="Presets", exact=True)).to_be_visible()
    expect(page.get_by_role("combobox", name="Interface language")).to_be_visible()
    more.press("Escape")
    expect(more).to_have_attribute("aria-expanded", "false")
    page.get_by_role("button", name="Preview", exact=True).click()
    expect(draft).to_be_hidden()
    expect(page.locator(".preview-canvas")).to_be_visible()
    viewport = page.locator(".preview-canvas-container")
    page.wait_for_function("""() => {
      const viewport = document.querySelector('.preview-canvas-container');
      return viewport.scrollWidth <= viewport.clientWidth && viewport.scrollHeight <= viewport.clientHeight;
    }""")
    page.get_by_role("button", name="Zoom in", exact=True).click()
    assert viewport.evaluate("el => el.scrollWidth > el.clientWidth")
    page.get_by_role("button", name="Fit page", exact=True).click()
    assert viewport.evaluate("el => el.scrollWidth <= el.clientWidth")
    expect(page.get_by_text("Pen", exact=True)).to_be_visible()
    tools = page.get_by_role("button", name="Tools", exact=True)
    tools.click()
    page.get_by_role("button", name="Margin guides", exact=True).click()
    expect(tools).to_have_attribute("aria-expanded", "false")
    tools.click()
    expect(page.get_by_role("button", name="Margin guides", exact=True)).to_have_attribute("aria-pressed", "true")
    tools.press("Escape")
    with page.expect_download() as download:
        page.get_by_role("button", name="Save current page", exact=True).click()
    assert download.value.suggested_filename.endswith(".png")
    page.get_by_role("button", name="Edit", exact=True).click()
    expect(draft).to_have_value("A draft on a small screen")
    expect(page.locator(".preview-canvas")).to_be_hidden()


def wait_for_save(page, text):
    page.wait_for_function("([key, text]) => localStorage.getItem(key) === text", arg=[TEXT_KEY, text])


def multi_tab(context, origin):
    first = context.new_page()
    first.goto(origin + "manifest.webmanifest")
    first.evaluate("""() => {
      localStorage.setItem('autohand_text_v1', 'Legacy draft');
      localStorage.setItem('autohand_paper_v1', JSON.stringify({type: 'blank'}));
    }""")
    first.goto(origin)
    expect(first.locator("textarea")).to_have_value("Legacy draft")
    old = editor(context, origin)
    paper_only = editor(context, origin)
    first.locator("textarea").fill("Newer draft")
    wait_for_save(first, "Newer draft")
    old.goto("about:blank")
    assert saved_text(first) == "Newer draft", "Closing a pristine tab overwrote the newer draft"
    paper_only.get_by_role("button", name="Paper", exact=True).click()
    paper_only.locator("select").filter(has=paper_only.locator("option[value=grid]")).select_option("grid")
    paper_only.wait_for_function("""() =>
      JSON.parse(localStorage.getItem('text2handwriting_paper_v1')).type === 'grid'""")
    assert saved_text(first) == "Newer draft", "Changing paper overwrote the newer draft"
    paper_only.locator(".tab-btn").first.click()
    paper_only.locator("textarea").fill("My conflicting edits")
    expect(paper_only.get_by_role("status")).to_contain_text("Another tab")
    expect(paper_only.locator("textarea")).to_have_value("My conflicting edits")
    assert saved_text(first) == "Newer draft", "Conflicting edits overwrote the newer draft"
    first.locator("textarea").fill("")
    wait_for_save(first, "")
    first.reload()
    expect(first.locator("textarea")).to_have_value("")


def concurrent_text(context, origin):
    first = editor(context, origin)
    second = editor(context, origin)
    edits = ["First tab edit", "Second tab edit"]
    for page, value in zip([first, second], edits):
        page.locator("textarea").fill(value)
    first.wait_for_function("([key, values]) => values.includes(localStorage.getItem(key))", arg=[TEXT_KEY, edits])
    winner = saved_text(first)
    losing_page = second if winner == edits[0] else first
    expect(losing_page.get_by_role("status")).to_contain_text("Another tab")
    expect(losing_page.locator("textarea")).to_have_value(edits[1] if winner == edits[0] else edits[0])
    assert saved_text(first) == winner


def blocked_storage(context, origin):
    context.add_init_script("""Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Blocked storage', 'SecurityError'); }
    })""")
    page = editor(context, origin)
    page.locator("textarea").fill("Session edit")
    expect(page.get_by_role("status")).to_contain_text("could not be saved")
    expect(page.locator("textarea")).to_have_value("Session edit")


def quota_failure(context, origin):
    page = editor(context, origin)
    page.locator("textarea").fill("Saved draft")
    wait_for_save(page, "Saved draft")
    page.evaluate("""(textKey) => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === textKey) throw new DOMException('Full storage', 'QuotaExceededError');
        return setItem.call(this, key, value);
      };
    }""", TEXT_KEY)
    page.locator("textarea").fill("Unsaved edits")
    expect(page.get_by_role("status")).to_contain_text("could not be saved")
    expect(page.locator("textarea")).to_have_value("Unsaved edits")
    assert saved_text(page) == "Saved draft"


def draw_mark(page):
    pen = page.get_by_role("button", name="Pen (draw arrows/diagrams on the paper)")
    if not page.get_by_role("button", name="Clear drawings on this page").is_enabled():
        layer = page.locator(".doodle-canvas")
        if layer.evaluate("el => getComputedStyle(el).pointerEvents") == "none":
            pen.click()
        layer.click(position={"x": 48, "y": 55})
    return page.locator(".doodle-canvas").evaluate("el => el.toDataURL()")


def replacement(context, origin, action):
    page = editor(context, origin)
    textarea = page.locator("textarea")
    textarea.fill("Original document")
    layer = page.locator(".doodle-canvas")
    empty_layer = layer.evaluate("el => el.toDataURL()")
    marked_layer = draw_mark(page)
    assert marked_layer != empty_layer
    textarea.fill("Original document, edited")
    assert layer.evaluate("el => el.toDataURL()") == marked_layer

    def replace():
        if action == "import":
            page.locator('input[accept*=".docx"]').set_input_files({
                "name": "new.txt", "mimeType": "text/plain", "buffer": b"Imported document",
            })
        elif action == "preset":
            if not page.get_by_role("dialog").count():
                page.get_by_role("button", name="Presets", exact=True).click()
            page.get_by_role("button", name="Apply preset: Classic Class Notes").click()
        else:
            page.get_by_role("button", name=action, exact=True).click()

    with page.expect_event("dialog") as pending:
        page.once("dialog", lambda dialog: dialog.dismiss())
        replace()
    assert pending.value.type == "confirm"
    assert "Hand-drawn annotations" in pending.value.message
    expect(textarea).to_have_value("Original document, edited")
    assert layer.evaluate("el => el.toDataURL()") == marked_layer

    page.once("dialog", lambda dialog: dialog.accept())
    replace()
    expect(textarea).not_to_have_value("Original document, edited")
    expect(page.get_by_role("button", name="Clear drawings on this page")).to_be_disabled()
    assert layer.evaluate("el => el.toDataURL()") == empty_layer

    with page.expect_download() as output:
        page.get_by_role("button", name="Save current page", exact=True).click()
    first = output.value.path().read_bytes()
    draw_mark(page)
    page.get_by_role("button", name="Clear drawings on this page").click()
    with page.expect_download() as output:
        page.get_by_role("button", name="Save current page", exact=True).click()
    assert first == output.value.path().read_bytes(), "Replacement export still contained the old mark"


def image_pixels(page, image_bytes):
    return page.evaluate("""async (data) => {
      const bytes = Uint8Array.from(atob(data), ch => ch.charCodeAt(0));
      const image = await createImageBitmap(new Blob([bytes]));
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      return [...ctx.getImageData(10, 10, 1, 1).data.slice(0, 3)];
    }""", base64.b64encode(image_bytes).decode())


def upload_background(page, color):
    encoded = page.evaluate("""color => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 160;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 160, 160);
      return canvas.toDataURL().split(',')[1];
    }""", color)
    page.locator('input[accept="image/*"]').set_input_files({
        "name": "paper.png", "mimeType": "image/png", "buffer": base64.b64decode(encoded),
    })


def background_snapshot(context, origin):
    page = editor(context, origin)
    set_standard_quality(page)
    page.locator("textarea").fill("Document at the moment of export")
    page.get_by_role("button", name="Photo", exact=True).click()
    upload_background(page, "#ff0000")
    page.wait_for_function("""() => {
      const ctx = document.querySelector('.preview-canvas').getContext('2d');
      return ctx.getImageData(10, 10, 1, 1).data[0] === 255;
    }""")
    page.evaluate("""() => {
      const NativeImage = window.Image;
      const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
      window.queuedBackgrounds = [];
      window.Image = function (...args) {
        const image = new NativeImage(...args);
        Object.defineProperty(image, 'src', {
          get() { return src.get.call(image); },
          set(url) {
            if (image.crossOrigin === 'anonymous') {
              window.queuedBackgrounds.push(() => src.set.call(image, url));
            } else {
              src.set.call(image, url);
            }
          },
        });
        return image;
      };
    }""")
    upload_background(page, "#0000ff")
    page.wait_for_function("window.queuedBackgrounds.length > 0 && document.fonts.status === 'loaded'")
    assert page.evaluate("window.queuedBackgrounds.length") == 1, "Preview and export loaded separate images"
    assert page.locator(".preview-canvas").evaluate("""el => {
      const pixels = el.getContext('2d').getImageData(10, 10, 1, 1).data;
      return !(pixels[0] === 255 && pixels[1] === 0 && pixels[2] === 0);
    }"""), "Live preview still showed the previous background during the new load"
    with page.expect_download() as output:
        page.get_by_role("button", name="Save current page", exact=True).click()
        page.get_by_role("button", name="Text", exact=True).click()
        page.locator("textarea").fill("Later edit")
        page.get_by_role("button", name="Photo", exact=True).click()
        first_count = page.evaluate("window.queuedBackgrounds.length")
        upload_background(page, "#00ff00")
        page.wait_for_function("count => window.queuedBackgrounds.length > count", arg=first_count)
        page.evaluate("window.queuedBackgrounds.splice(0).forEach(load => load())")
    exported = output.value.path().read_bytes()
    assert image_pixels(page, exported) == [0, 0, 255], "Export didn't use the blue background selected at click"
    page.wait_for_function("""() => document.querySelector('.preview-canvas')
      .getContext('2d').getImageData(10, 10, 1, 1).data[1] === 255""")
    page.get_by_role("button", name="Text", exact=True).click()
    page.locator("textarea").fill("Document at the moment of export")
    page.get_by_role("button", name="Photo", exact=True).click()
    # The upload decoder runs normally. Release only the shared display/export load.
    upload_background(page, "#0000ff")
    page.wait_for_function("window.queuedBackgrounds.length > 0")
    page.evaluate("window.queuedBackgrounds.splice(0).forEach(load => load())")
    with page.expect_download() as output:
        page.get_by_role("button", name="Save current page", exact=True).click()
    assert output.value.path().read_bytes() == exported, "Later edits changed the in-flight document snapshot"


def document_outputs(context, origin):
    page = editor(context, origin)
    set_standard_quality(page)
    page.locator("textarea").fill("\n".join(f"Printed line {i}" for i in range(20)))
    page.get_by_role("button", name="Photo", exact=True).click()
    upload_background(page, "#ff0000")
    expect(page.get_by_text("Page 1 / 2", exact=True)).to_be_visible()
    page.wait_for_function("""() => {
      const pixels = document.querySelector('.preview-canvas').getContext('2d')
        .getImageData(10, 10, 1, 1).data;
      return pixels[0] === 255 && pixels[1] === 0 && pixels[2] === 0;
    }""")

    def download(option):
        page.get_by_role("button", name="Export", exact=True).click()
        with page.expect_download() as output:
            page.get_by_role("button", name=option, exact=True).click()
        return output.value.path().read_bytes()

    unmarked = download("Export current page (PNG)")
    draw_mark(page)
    marked = download("Export current page (PNG)")
    assert marked != unmarked and image_pixels(page, marked) == [255, 0, 0]
    page.get_by_role("button", name="Margin guides", exact=True).click()
    assert download("Export current page (PNG)") == marked, "Export included the preview guides"

    def assert_red_image(data):
        red, green, blue = image_pixels(page, data)
        assert red > 245 and green < 10 and blue < 10, "Output lost the red background"

    assert_red_image(download("Export current page (JPG)"))
    with zipfile.ZipFile(io.BytesIO(download("Export all as ZIP (images)"))) as archive:
        assert len(archive.namelist()) == 2
        assert archive.read(archive.namelist()[0]) == marked
        assert_red_image(archive.read(archive.namelist()[1]))
    pdf = download("Export all as PDF")
    assert len(re.findall(rb"/Type /Page\b", pdf)) == 2
    embedded_images = re.findall(rb"\xff\xd8\xff.*?\xff\xd9", pdf, re.S)
    assert len(embedded_images) == 2
    for image in embedded_images:
        assert_red_image(image)

    # Capture the real iframe document at print(), then run Chromium's print
    # renderer on that document to exercise its page size and content.
    page.evaluate("""() => {
      const appendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function (node) {
        if (node instanceof HTMLIFrameElement) {
          const onload = node.onload;
          node.onload = function (...args) {
            const frame = node.contentWindow;
            frame.print = () => {
              const doc = frame.document;
              window.printSnapshot = {
                html: doc.documentElement.outerHTML,
                image: doc.querySelector('img').src,
              };
              setTimeout(() => frame.dispatchEvent(new Event('afterprint')), 0);
            };
            onload?.apply(this, args);
          };
        }
        return appendChild.call(this, node);
      };
    }""")
    page.get_by_role("button", name="Export", exact=True).click()
    page.get_by_role("button", name="Print current page", exact=True).click()
    page.wait_for_function("window.printSnapshot !== undefined")
    snapshot = page.evaluate("window.printSnapshot")
    assert base64.b64decode(snapshot["image"].split(",", 1)[1]) == marked
    preview = context.new_page()
    preview.set_content(snapshot["html"])
    print_pdf = preview.pdf(print_background=True, prefer_css_page_size=True)
    assert len(re.findall(rb"/Type /Page\b", print_pdf)) == 1
    dimensions = re.search(rb"/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]", print_pdf)
    assert dimensions, "Print output has no page dimensions"
    assert all(abs(float(side) - 210 * 72 / 25.4) < 2 for side in dimensions.groups())


def track_arabic_drawing(context):
    context.set_default_navigation_timeout(15_000)
    context.route("https://fonts.googleapis.com/**", lambda route: route.abort())
    context.add_init_script("""(() => {
      window.textDraws = [];
      const fillText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...rest) {
        if (this.canvas.classList.contains('preview-canvas')) {
          const point = this.getTransform().transformPoint({x, y});
          window.textDraws.push({
            text, x: point.x, y: point.y, direction: this.direction, align: this.textAlign,
          });
        }
        return fillText.call(this, text, x, y, ...rest);
      };
    })()""")


def arabic_sample(context, origin):
    context.add_init_script("localStorage.setItem('text2handwriting_language', 'ar')")
    track_arabic_drawing(context)
    page = editor(context, origin)
    assert page.locator("textarea").input_value().startswith("تقرير مختبر الفيزياء")
    page.wait_for_function("""() => window.textDraws.some(line =>
      line.text.startsWith('تقرير مختبر الفيزياء') && line.direction === 'rtl' && line.align === 'right')""")


def arabic_mixed_outputs(context, origin):
    track_arabic_drawing(context)
    page = editor(context, origin)
    set_standard_quality(page)
    first_line = "النتيجة (CPU 123) هي ٤٥٫٦"
    second_line = "CPU 123 (اختبار المعالج)"
    phrase = "تتصل الحروف العربية داخل كل كلمة"
    paragraph = " ".join([phrase] * 4 + ["(RAM 456)"] + [phrase] * 4) + " خاتمة"
    page.evaluate("window.textDraws = []")
    page.locator("textarea").fill("\n".join([first_line, second_line, paragraph]))
    page.wait_for_function("""([rtl, ltr]) => {
      const right = window.textDraws.find(line => line.text === rtl);
      const left = window.textDraws.find(line => line.text === ltr);
      return right?.direction === 'rtl' && right.align === 'right'
        && left?.direction === 'ltr' && left.align === 'left'
        && window.textDraws.some(line => line.text.includes('خاتمة'));
    }""", arg=[first_line, second_line])
    draws = page.evaluate("window.textDraws")
    lines = sorted({line["y"]: line for line in draws}.values(), key=lambda line: line["y"])
    assert lines[0]["x"] > lines[1]["x"]
    assert len(lines) > 3 and all(line["direction"] == "rtl" for line in lines[2:])
    assert " ".join(line["text"] for line in lines[2:]) == paragraph
    assert any("(RAM 456)" in line["text"] for line in lines[2:])

    canvas = page.locator(".preview-canvas")
    await_fonts = """async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }"""
    page.evaluate(await_fonts)
    expected_png = canvas.evaluate("el => el.toDataURL('image/png').split(',')[1]")
    expected_jpeg = canvas.evaluate("el => el.toDataURL('image/jpeg', 0.92).split(',')[1]")
    with page.expect_download() as output:
        page.get_by_role("button", name="Save current page", exact=True).click()
    assert output.value.path().read_bytes() == base64.b64decode(expected_png), "PNG differs from the Arabic preview"
    page.get_by_role("button", name="Export", exact=True).click()
    with page.expect_download() as output:
        page.get_by_role("button", name="Export all as PDF", exact=True).click()
    pdf = output.value.path().read_bytes()
    assert len(re.findall(rb"/Type /Page\b", pdf)) == 1
    assert base64.b64decode(expected_jpeg) in pdf, "PDF used a different Arabic layout than the preview"

    page.locator("header select").first.select_option("ar")
    expect(page.locator("html")).to_have_attribute("dir", "rtl")
    page.evaluate(await_fonts)
    assert canvas.evaluate("el => el.toDataURL().split(',')[1]") == expected_png


def txt_indentation(context, origin):
    page = editor(context, origin)
    textarea = page.locator("textarea")
    upload = page.locator('input[accept*=".txt"]')
    note = "　　第一行\n第二行  \n"
    for encoding in ("utf-8", "gb18030"):
        textarea.fill("Existing document")
        page.once("dialog", lambda dialog: dialog.accept())
        upload.set_input_files({"name": "notes.txt", "mimeType": "text/plain", "buffer": note.encode(encoding)})
        expect(textarea).to_have_value(note)
    with page.expect_event("dialog") as pending:
        page.once("dialog", lambda dialog: dialog.accept())
        upload.set_input_files({"name": "blank.txt", "mimeType": "text/plain", "buffer": b" \t\n "})
    assert pending.value.type == "alert" and "No text could be extracted" in pending.value.message
    expect(textarea).to_have_value(note)


def paper_effects(context, origin, effect):
    page = editor(context, origin)
    page.locator("textarea").fill("")
    set_standard_quality(page)
    page.get_by_role("button", name="Photo", exact=True).click()
    texture = page.locator("select").filter(has=page.locator('option[value="creased"]'))
    vignette = page.locator(".tab-content input[type=checkbox]").last
    canvas = page.locator(".preview-canvas")

    def png():
        page.evaluate("() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)))")
        return canvas.evaluate("el => el.toDataURL().split(',')[1]")

    texture.select_option("clean")
    vignette.uncheck()
    clean = png()
    if effect == "textures":
        textures = {clean}
        for mode in ["creased", "vintage", "photo"]:
            texture.select_option(mode)
            vignette.uncheck()
            textures.add(png())
        assert len(textures) == 4, "Expected four distinct textures with vignette disabled"
        expected = png()
        with page.expect_download() as downloaded:
            page.get_by_role("button", name="Save current page", exact=True).click()
        assert downloaded.value.path().read_bytes() == base64.b64decode(expected)
    else:
        texture.select_option("photo")
        vignette.uncheck()
        photo = png()
        assert photo != clean, "Turning off vignette removed photo lighting"
        vignette.check()
        assert png() != photo, "Vignette control did not change the photo pixels"
        texture.select_option("creased")
        expect(vignette).to_be_checked()
        vignette.uncheck()
        texture.select_option("photo")
        expect(vignette).not_to_be_checked()
        assert png() == photo


def latest_language_selection(context, origin, choice):
    page = editor(context, origin)
    selector = page.locator("header select").first
    delayed = []
    arabic_chunk = re.compile(r"/assets/ar-[^/]+\.js$")
    page.route(arabic_chunk, lambda route: delayed.append(route))
    with page.expect_event("request", predicate=lambda request: arabic_chunk.search(request.url)):
        selector.select_option("ar")
    expect(selector).to_have_value("ar")
    selector.select_option(choice)
    expect(page.locator("html")).to_have_attribute("lang", choice)
    expect(page.get_by_role("button", name="预设模板" if choice == "zh-CN" else "Presets", exact=True)).to_be_visible()
    newer_title = page.title()
    with page.expect_event("requestfinished", predicate=lambda request: arabic_chunk.search(request.url)):
        delayed.pop().continue_()
    page.wait_for_load_state("networkidle")
    expect(selector).to_have_value(choice)
    expect(page.locator("html")).to_have_attribute("dir", "ltr")
    assert page.title() == newer_title
    assert page.evaluate("localStorage.getItem('text2handwriting_language')") == choice


def named_paper_sliders(context, origin):
    page = editor(context, origin)
    page.get_by_role("button", name="Paper", exact=True).click()
    names = ["Left writing margin", "Right wrap margin", "Top first-line margin", "Bottom last-line margin"]
    for name in ["Line spacing (ruling gap)", *names]:
        expect(page.get_by_role("slider", name=name, exact=True)).to_be_visible()
    page.locator("select").filter(has=page.locator("option[value=grid]")).select_option("grid")
    for name in ["Essay grid columns", *names]:
        expect(page.get_by_role("slider", name=name, exact=True)).to_be_visible()
    slider = page.get_by_role("slider", name="Essay grid columns", exact=True)
    current = int(slider.input_value())
    slider.press("ArrowRight")
    expect(slider).to_have_value(str(current + 1))


def long_document_updates(context, origin, control):
    page = editor(context, origin)
    page.set_default_timeout(20_000)
    phrase = "今天我们记录春雨来临后的校园变化。树叶上的水珠沿着叶脉滑落，操场边的积水映出灰白色的天空。"
    note = ("\n".join([phrase] * 1_200))[:50_000]
    page.locator("textarea").fill(note)
    wait_for_save(page, note)
    if control == "brightness":
        page.get_by_role("button", name="Photo", exact=True).click()
        upload_background(page, "#808080")
        page.wait_for_function("""() => document.querySelector('.preview-canvas')
          .getContext('2d').getImageData(10, 10, 1, 1).data[0] === 128""")

    result = page.evaluate(r"""async (control) => {
      const afterPaint = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await document.fonts.ready;
      await afterPaint();

      let sample;
      const split = String.prototype.split;
      // typesetText and the text tab's line counter split paragraphs this way.
      String.prototype.split = function (separator, ...rest) {
        if (sample && this.length >= 50_000 && separator?.source === '\\r?\\n') sample.layouts++;
        return split.call(this, separator, ...rest);
      };
      const clearRect = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (sample && this.canvas.classList.contains('preview-canvas')) sample.draws++;
        return clearRect.apply(this, args);
      };

      const slider = control === 'brightness';
      const field = document.querySelector(slider
        ? '.tab-content input[min="0.6"][max="1.4"]'
        : 'textarea');
      const setValue = Object.getOwnPropertyDescriptor(
        slider ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype, 'value',
      ).set;
      const stats = document.querySelector('.brand-stats');
      const before = stats.textContent;
      const samples = [];
      try {
        for (let index = 0; index < 7; index++) {
          sample = { layouts: 0, draws: 0 };
          const start = performance.now();
          const value = slider ? String(0.65 + index * 0.1) : field.value + '字';
          setValue.call(field, value);
          field.dispatchEvent(new Event('input', { bubbles: true }));
          await afterPaint();
          samples.push({ ...sample, ms: performance.now() - start });
          sample = undefined;
        }
        return { before, after: stats.textContent, samples };
      } finally {
        String.prototype.split = split;
        CanvasRenderingContext2D.prototype.clearRect = clearRect;
      }
    }""", control)
    samples = result["samples"]
    print(f"  50k {control}: median {median(x['ms'] for x in samples):.1f} ms; "
          f"paragraph splits {[x['layouts'] for x in samples]}, draws {[x['draws'] for x in samples]}", flush=True)
    if control == "brightness":
        assert result["before"] == result["after"], "Visual adjustment changed document stats"
        assert all(x["layouts"] == 0 for x in samples), "Visual adjustment re-typeset the document"
        pixel = page.locator(".preview-canvas").evaluate("el => el.getContext('2d').getImageData(10, 10, 1, 1).data[0]")
        assert pixel > 128, "Brightness did not change the canvas pixels"
        page.get_by_role("button", name="Paper", exact=True).click()
        size = page.locator("select").filter(has=page.locator('option[value="a5"]'))
        size.select_option("a5")
        expect(page.locator(".brand-stats")).not_to_have_text(result["after"])
    else:
        assert result["before"] != result["after"], "Text edits didn't update the layout stats"
    assert all(x["draws"] == 1 for x in samples), "A settled font caused duplicate preview drawing"


def pdf_intermediate_progress(context, origin):
    page = editor(context, origin)
    set_standard_quality(page)
    page.locator("textarea").fill("\n".join(f"PDF progress test line {i}" for i in range(100)))
    expect(page.get_by_text("Page 1 / 4", exact=True)).to_be_visible()
    page.evaluate(r"""() => {
      window.pdfFrames = [];
      const record = () => {
        const text = document.querySelector('.modal-card')?.textContent;
        const match = text?.match(/Completed (\d+) \/ (\d+) pages/);
        if (match) window.pdfFrames.push(Number(match[1]));
        requestAnimationFrame(record);
      };
      requestAnimationFrame(record);
    }""")
    page.get_by_role("button", name="Export", exact=True).click()
    with page.expect_download(timeout=30_000) as output:
        page.get_by_role("button", name="Export all as PDF", exact=True).click()
    assert len(re.findall(rb"/Type /Page\b", output.value.path().read_bytes())) == 4
    visible_pages = sorted(set(page.evaluate("window.pdfFrames")))
    print(f"  PDF progress frames: {visible_pages}", flush=True)
    assert any(0 < step < 4 for step in visible_pages), "PDF showed no intermediate progress on a browser frame"


def preview_waits_for_loading_fonts(context, origin):
    page = editor(context, origin)
    after_paint = "async () => { await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))); }"
    page.evaluate("async () => { await document.fonts.ready; }")
    page.evaluate(after_paint)
    pending = []
    font_path = "**/fonts/LongCang-Regular.ttf"
    page.route(font_path, lambda route: pending.append(route))
    with page.expect_request(font_path):
        page.evaluate("""() => {
          window.fontDraws = 0;
          const clearRect = CanvasRenderingContext2D.prototype.clearRect;
          CanvasRenderingContext2D.prototype.clearRect = function (...args) {
            if (this.canvas.classList.contains('preview-canvas')) window.fontDraws++;
            return clearRect.apply(this, args);
          };
          const font = new FontFace('Slow preview font', 'url(/fonts/LongCang-Regular.ttf)');
          document.fonts.add(font);
          void font.load();
        }""")
    expect(page.locator("textarea")).to_be_visible()
    assert page.evaluate("document.fonts.status") == "loading"
    page.locator("textarea").fill("Repaint after the font has loaded.")
    page.evaluate(after_paint)
    assert page.evaluate("window.fontDraws") == 1
    pending.pop().continue_()
    page.evaluate("async () => { await document.fonts.ready; }")
    page.evaluate(after_paint)
    assert page.evaluate("window.fontDraws") == 2, "The preview did not repaint after an actual font load"


def offline(context, url):
    page = editor(context, url)
    page.wait_for_function("navigator.serviceWorker.controller !== null")
    page.locator("textarea").fill("Saved before going offline")
    wait_for_save(page, "Saved before going offline")
    assert page.evaluate("""async () => Boolean(await caches.match(location.href)
      || await caches.match(new URL('index.html', location.href)))"""), "SW did not cache the entry HTML"
    context.set_offline(True)
    reopened = editor(context, url)
    expect(reopened.locator("textarea")).to_have_value("Saved before going offline")
    reopened.locator("textarea").fill("Edited offline")
    wait_for_save(reopened, "Edited offline")


def cache_isolation(context, origin):
    # The setup page shares the origin but lies outside either worker's app shell.
    page = context.new_page()
    page.goto(origin + "manifest.webmanifest")
    page.evaluate("""async () => {
      const cache = await caches.open('another-app-cache');
      await cache.put('/other/app.js', new Response('other app'));
    }""")
    subpath = editor(context, origin + "handwriting/")
    subpath.wait_for_function("navigator.serviceWorker.controller !== null")
    assert subpath.evaluate("caches.has('another-app-cache')"), "Subpath worker deleted another app's cache"
    subpath_keys = set(subpath.evaluate("caches.keys()"))
    root = editor(context, origin)
    root.wait_for_function("navigator.serviceWorker.controller !== null")
    assert subpath_keys <= set(root.evaluate("caches.keys()")), "Root worker deleted the subpath cache"
    assert root.evaluate("""async () =>
      await (await caches.match('/other/app.js'))?.text()""") == "other app"


def worker_update(context, origin, server, dist):
    page = editor(context, origin)
    page.wait_for_function("navigator.serviceWorker.controller !== null")
    page.locator("textarea").fill("Draft during update")
    wait_for_save(page, "Draft during update")
    original_worker = (dist / "sw.js").read_text(encoding="utf-8")
    original_build = re.search(r"const BUILD = (.+);", original_worker).group(1)
    build = json.loads(original_build)
    build["version"] = "test-failed-update"
    build["resources"].append("missing-test-resource.js")
    try:
        server.replacement_worker = original_worker.replace(original_build, json.dumps(build)).encode()
        state = page.evaluate("""async () => {
          const registration = await navigator.serviceWorker.ready;
          const state = new Promise(resolve => registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'redundant' || worker.state === 'installed') resolve(worker.state);
            });
          }, { once: true }));
          await registration.update();
          return state;
        }""")
        assert state == "redundant", "An incomplete shell installed successfully"
        context.set_offline(True)
        page.reload()
        expect(page.locator("textarea")).to_have_value("Draft during update")
        context.set_offline(False)

        build["version"] = "test-complete-update"
        build["resources"].pop()
        server.replacement_worker = original_worker.replace(original_build, json.dumps(build)).encode()
        page.evaluate("async () => (await navigator.serviceWorker.ready).update()")
        page.wait_for_function("async () => Boolean((await navigator.serviceWorker.ready).waiting)")
        assert page.evaluate("caches.has('text2handwriting:%2F:test-complete-update:shell')")
        assert page.evaluate("caches.has('text2handwriting:%2F:' + "
                             + json.dumps(json.loads(original_build)["version"]) + " + ':shell')")
        page.close()
        fresh = editor(context, origin)
        fresh.wait_for_function("async () => navigator.serviceWorker.controller !== null && "
                                "!(await caches.has('text2handwriting:%2F:test-failed-update:shell'))")
        expect(fresh.locator("textarea")).to_have_value("Draft during update")
    finally:
        server.replacement_worker = None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chrome", help="System Chrome executable")
    parser.add_argument("--case", help="Only run cases whose name includes this text")
    args = parser.parse_args()
    dist = Path(__file__).resolve().parents[1] / "dist"
    if not (dist / "index.html").is_file():
        parser.error("Run npm run build first")
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(StaticHandler, directory=str(dist)))
    Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_port}/"
    cases = {
        "mobile workspace and PNG download": mobile_workspace,
        "multi-tab draft and legacy migration": multi_tab,
        "concurrent edits": concurrent_text,
        "blocked storage": blocked_storage,
        "quota failure": quota_failure,
        "document replacement by import": lambda ctx, base: replacement(ctx, base, "import"),
        "document replacement by preset": lambda ctx, base: replacement(ctx, base, "preset"),
        "document replacement by sample": lambda ctx, base: replacement(ctx, base, "Sample"),
        "document replacement by clear": lambda ctx, base: replacement(ctx, base, "Clear"),
        "background and text snapshot": background_snapshot,
        "document output formats and print preview": document_outputs,
        "Arabic built-in sample": arabic_sample,
        "Arabic mixed text, wrapping, PNG and PDF": arabic_mixed_outputs,
        "P2 TXT indentation": txt_indentation,
        "P2 paper textures": lambda ctx, base: paper_effects(ctx, base, "textures"),
        "P2 independent vignette": lambda ctx, base: paper_effects(ctx, base, "vignette"),
        "P2 latest language selection": lambda ctx, base: latest_language_selection(ctx, base, "zh-CN"),
        "P2 latest language selection returning to English": lambda ctx, base: latest_language_selection(ctx, base, "en"),
        "P2 named paper sliders": named_paper_sliders,
        "Performance long edit and settled fonts": lambda ctx, base: long_document_updates(ctx, base, "typing"),
        "Performance long document brightness adjustment": lambda ctx, base: long_document_updates(ctx, base, "brightness"),
        "Performance intermediate PDF progress": pdf_intermediate_progress,
        "Performance preview waits for loading fonts": preview_waits_for_loading_fonts,
        "first offline reopen at root": offline,
        "first offline reopen at subpath": lambda ctx, base: offline(ctx, base + "handwriting/"),
        "same-origin cache isolation": cache_isolation,
        "failed and waiting worker updates": lambda ctx, base: worker_update(ctx, base, server, dist),
    }
    if args.case:
        cases = {name: run for name, run in cases.items() if args.case in name}
        if not cases:
            parser.error("No matching test case")
    failed = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=args.chrome, args=[
                "--no-proxy-server",
                "--host-resolver-rules=MAP fonts.googleapis.com ~NOTFOUND, MAP fonts.gstatic.com ~NOTFOUND",
            ])
            for name, run in cases.items():
                context = browser.new_context(
                    locale="en-US",
                    service_workers="block" if name.startswith("P2 latest language selection")
                    or name == "Performance preview waits for loading fonts" else "allow",
                )
                context.set_default_timeout(6_000)
                try:
                    run(context, origin)
                    print(f"PASS {name}", flush=True)
                except Exception as exc:
                    failed.append(name)
                    detail = str(exc).splitlines() or [type(exc).__name__]
                    print(f"FAIL {name}: {detail[0]}", flush=True)
                finally:
                    context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    return bool(failed)


if __name__ == "__main__":
    raise SystemExit(main())
