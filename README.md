# The Spark

The professional portfolio of Megan Landman. It's a static website (plain HTML, CSS and JavaScript) built for GitHub Pages. It has no framework and needs no build step.

## Folder structure

```
index.html                  Home
about/index.html            About me
practice/index.html         My practice
thinking/index.html         What guides my practice
looking-forward/index.html  Looking forward
404.html                    Shown for addresses that don't exist
.nojekyll                   Tells GitHub Pages to serve the files exactly as they are

assets/
  css/spark.css             The design system: colours, fonts, spacing, navigation and all page styles
  js/spark.js               Menu, section reveals, spark animation, and the three-elements diagram
  fonts/                    Space Grotesk, Manrope and Newsreader (self-hosted, free licence)
  img/                      Images (favicon now; River of Life and others later)
  docs/                     The PPDP (megan-landman-ppdp.pdf)
```

## Publishing on GitHub Pages

1. Upload everything in this folder to the root of your repository. That includes the hidden `.nojekyll` file: on a Mac, press Cmd + Shift + . to show hidden files.
2. In the repository, go to **Settings → Pages**.
3. Under "Build and deployment", choose **Deploy from a branch**, select `main` and `/ (root)`, then click **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/<repository-name>/`.

All links between pages are relative, so the site works at any repository name.

## Previewing on your computer

Double-click `index.html` to open it in your browser. The pages, links and animation all work offline.

## Editing

- **Text:** open the page's `index.html` in any text editor (VS Code is a good free choice) and change the words between the tags.
- **Colours, fonts and spacing:** change the values at the top of `assets/css/spark.css` under "2. Tokens". Every page updates.
- **Navigation:** the menu and the footer are repeated at the top and bottom of each page. If you add or rename a page, update the menu on every page.
- **Images:** put them in `assets/img/`. Keep photos under about 300 KB and always write a description in the `alt` text.
- **River of Life image:** it lives at `assets/img/river-of-life.webp` (shown by modern browsers) and `assets/img/river-of-life.jpg` (fallback and full-size link). To replace it, save new versions with the same names. If the proportions change, update the `width` and `height` on its `<img>` tag in `about/index.html`.
- **Placeholders:** search for `placeholder` to find everything still waiting for content.

## Accessibility and behaviour

- Pages can be navigated by keyboard. There is a "Skip to content" link, and focus is clearly visible.
- If the device is set to reduce motion, the spark animation becomes a still image and nothing slides or fades.
- Content is always visible, even if JavaScript is blocked. The animations are an extra layer on top.
