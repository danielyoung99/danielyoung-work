# Editing danielyoung.work

You edit plain text files. A small script turns them into the pages. You never edit the HTML by hand.

```
_content/
  home.txt            the headline on the home page
  about.txt           the intro paragraph on the About page
  order.txt           which case studies appear, and in what order
  studies/            one text file per case study
  templates/          the page frames (leave these alone unless you want to change the design)
assets/img/case-studies/<name>/    the images for each case study
```

The About page (danielyoung.work/about/) takes its intro paragraph from `_content/about.txt`. Experience and Education live in `_content/templates/about.html`. Edit them there.

There is no CV page any more: /cv/ is a redirect to the About page, which has the experience, awards and education.

The page people see at a broken link (404) is `_content/templates/404.html`. The Contact page (danielyoung.work/contact/) is `_content/templates/contact.html`. The Work page (danielyoung.work/work/) is a list built from `order.txt`: each row takes the study's name, its Services (or Work, or For) line and its landscape home image, so adding or reordering a case study updates it. The page frame is `_content/templates/work.html`.

## The everyday routine

1. Change a text file, or add or swap images.
2. In Terminal, from this folder, run `python3 _build.py`. It rebuilds the pages and tells you if anything is wrong.
3. Check it if you like. Open `index.html` in a browser.
4. Run `sh _publish.sh`. It shows what changed, asks you to confirm, saves a backup zip, and pushes it live. The site updates in about 3 minutes.

## Change the words

Open `_content/studies/<name>.txt`.

- The lines above `---` are the details: the big line at the top (`title:`), the search description, the facts (Client, Role and so on) and the sentence shown on the home page (`card:`).
- Everything below `---` is the page, top to bottom.
- A line starting with `# ` is a heading. The paragraphs under it are its text. Leave a blank line between paragraphs.
- A line starting with `> ` is a large pull quote.
- Lines starting with `//` are notes to yourself and never appear on the site.
- To make a word italic, wrap it in `<em>` and `</em>`. Type `&` normally.

## Change or add images

Images live in `assets/img/case-studies/<name>/`. Use .jpg or .png.

- Swap an image: put the new file in with the same file name.
- Add one: put the file in the folder, then add it to an `images` block in the text file (below).
- Sizes: landscape 2160 x 1440, portrait 1080 x 1440. The script reads the real size from the file.

Images are listed in blocks, one image per line, in this form:

```
images v-d:
  04-landscape.jpg | Describe the image for screen readers.
  05-portrait.jpg | Describe the image for screen readers.
```

The word after `images` is the layout. You can leave it out and the script picks one.

| Layout | What it is |
| --- | --- |
| `full` | One landscape image, full width. Add `\| A caption` after the description for a caption. |
| `free` | One image at its own proportions (websites, mock-ups). |
| `solo` | One portrait image, centred. |
| `pp` | Two portraits side by side. |
| `row3` | Three portraits in a row. |
| `v-a` to `v-e` | One landscape and one portrait, arranged five different ways. Try each. |
| `scroll` | A tall page image in a scrolling frame. The third part is the caption. |

The image order on the page is the order you list them. Move a block up or down to move it.

## Home page images

In the details of each study, the `home:` line chooses the two images on the home page: one landscape and one portrait, joined with ` + `. The order you write them sets which comes first in the markup. Their position on the page (the five arrangements) follows the study's place in the list, so the layouts keep alternating however you reorder.

## Change the order

Open `_content/order.txt`. Move a line up or down. That sets the order on the home page and the previous and next links at the bottom of each case study. Save and run the build.

## Notes (the blog)

Each note is a text file in `_content/notes/`, and `python3 _build.py` makes the listing at /notes/ and a page for each one. The listing is newest first, by the date in each file. Copy an existing file to start a new one.

```
title: The big heading. Use <em> if you like.
name: The same heading as plain text, for the listing and the browser tab
date: 2026-11-01
category: Process
summary: One or two sentences for the listing and link previews.
read: 1 min read
margin: A line shown in the left column beside the text (optional).
how-label: How this was written
how: A line about how it was written, shown at the end (optional).

---

The first paragraph is shown a little larger.

# A heading

More paragraphs. Leave a blank line between them. Links look like [this](https://example.com).

> A big pull quote.
```

A carousel note (like Stem Systems) adds `kind: carousel`, then a `slides:` block (`slide-01.jpg | description`, with the images in `assets/img/notes/<note-name>/`) and a `transcript:` block (`Heading | text`).

## The Lab (my own apps, sites and tools)

The Lab page (danielyoung.work/lab/) is a list built from one file, `_content/lab.txt`. Each item is a block of `name: value` lines, with a blank line between items. Only `name`, `kind` and `summary` are needed. Add `link:` and `action:` to make the row clickable, `image:` for a picture beside the text (the file goes in `assets/img/`), and `built:` for what it was made with. The order in the file is the order on the page.

An item can have its own write-up page. Put a text file in `_content/lab/` (it works exactly like a case study file, but needs both `prev:` and `next:` lines) and it is built at `/lab/<name>/`. Chapter & Verse is one. Case studies are for client work only: they live in `_content/studies/` and are listed in `order.txt`.

## Notes and Lab cards on the home page

Below the work, the home page shows the three newest notes (by date) and the first four items in `_content/lab.txt`. Nothing to set up: add a note or change the order in `lab.txt` and run the build. A Lab card with no `link:` goes to the Lab page.

## Add a case study

```
python3 _build.py new "Client Name"
```

This creates a text file with a starter layout, an empty image folder and an entry at the top of `order.txt`. Then:

1. Put the images in `assets/img/case-studies/client-name/`.
2. Open `_content/studies/client-name.txt`, replace the placeholder text and image file names.
3. Run `python3 _build.py`. It will tell you about any missing image or detail.
4. Run `sh _publish.sh`.

## Remove a case study

Delete its line from `order.txt`. Run the build, then delete its folder in `work/` so the old page stops being live. Publish.

## If something goes wrong

- The build stops with a plain message saying what to fix. Nothing half-built is published.
- Every publish saves a backup zip in `danielyoung-work Backups/`.
- Everything before the move to this system is tagged `pre-content-system-2026-11-06` in Git, and a zip of the old site sits in the Backups folder.

## Notes

- Do not run `_src/sync.sh`. It belongs to an earlier version of the site and would overwrite these pages.
- Only the home page and the 12 case studies are built from `_content/`. The Work index, About, Notes, Contact, CV and 404 pages are still separate files.
