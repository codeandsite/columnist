#!/usr/bin/env node
/**
 * make-sample-epub.mjs
 * Generates a small, valid EPUB 2 file for testing the Columnist reader.
 * Content: public-domain excerpts from the Meditations of Marcus Aurelius
 * (George Long translation, 1862 — public domain), wrapped in original
 * Columnist front matter.
 *
 * Usage:  npm run make-sample-epub
 * Output: scripts/sample-meditations.epub
 *
 * An admin can upload this via Admin → Books → [book] → EPUB to test
 * the online reader end-to-end.
 */
import JSZip from "jszip";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "sample-meditations.epub");

const INTRO = `This sample edition was prepared by Columnist to demonstrate the online reader. The excerpts that follow are from the <i>Meditations</i> of Marcus Aurelius, in the 1862 English translation by George Long, which is in the public domain.`;

const CHAPTERS = [
  {
    title: "Book II — Begin the Morning",
    body: [
      "Begin the morning by saying to thyself, I shall meet with the busy-body, the ungrateful, arrogant, deceitful, envious, unsocial. All these things happen to them by reason of their ignorance of what is good and evil.",
      "But I who have seen the nature of the good that it is beautiful, and of the bad that it is ugly, and the nature of him who does wrong, that it is akin to me, not only of the same blood or seed, but that it participates in the same intelligence and the same portion of the divinity, I can neither be injured by any of them, for no one can fix on me what is ugly, nor can I be angry with my kinsman, nor hate him.",
      "For we are made for co-operation, like feet, like hands, like eyelids, like the rows of the upper and lower teeth. To act against one another then is contrary to nature; and it is acting against one another to be vexed and to turn away.",
    ],
  },
  {
    title: "Book IV — The Inner Citadel",
    body: [
      "Men seek retreats for themselves, houses in the country, sea-shores, and mountains; and thou too art wont to desire such things very much. But this is altogether a mark of the most common sort of men, for it is in thy power whenever thou shalt choose to retire into thyself.",
      "For nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul, particularly when he has within him such thoughts that by looking into them he is immediately in perfect tranquillity; and I affirm that tranquillity is nothing else than the good ordering of the mind.",
      "Constantly then give to thyself this retreat, and renew thyself.",
    ],
  },
  {
    title: "Book VII — The Present Moment",
    body: [
      "Do not waste the remainder of thy life in thoughts about others, when thou dost not refer thy thoughts to some object of common utility. For thou losest the opportunity of doing something else when thou hast such thoughts as these.",
      "What is this but to live as if thou wast going to live ten thousand years? Death hangs over thee. While thou livest, while it is in thy power, be good.",
      "If it is not right do not do it; if it is not true do not say it.",
    ],
  },
];

const xhtml = (title, inner) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${title}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body><h1>${title}</h1>${inner}</body>
</html>`;

const css = `body { font-family: Georgia, serif; line-height: 1.7; margin: 5%; }
h1 { font-size: 1.4em; margin-bottom: 1em; }
p { text-indent: 1.2em; margin: 0 0 0.6em; }
p.lead { text-indent: 0; font-style: italic; }
div.title-page { text-align: center; margin-top: 20%; }
div.title-page h1 { font-size: 2em; }
div.title-page p { text-indent: 0; }`;

async function main() {
  const zip = new JSZip();
  // mimetype MUST be first and uncompressed
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="utf-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n  <rootfiles>\n    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n  </rootfiles>\n</container>`
  );

  const manifestItems = [];
  const spineItems = [];
  const ncxPoints = [];
  let n = 0;
  const add = (id, href, media, content) => {
    zip.file(`OEBPS/${href}`, content);
    manifestItems.push(`<item id="${id}" href="${href}" media-type="${media}"/>`);
    return id;
  };

  add("css", "style.css", "text/css", css);
  add("ncx", "toc.ncx", "application/x-dtbncx+xml", "__NCX__");

  const pushChapter = (fileId, title, htmlInner, order) => {
    add(fileId, `${fileId}.xhtml`, "application/xhtml+xml", xhtml(title, htmlInner));
    spineItems.push(`<itemref idref="${fileId}"/>`);
    ncxPoints.push(
      `<navPoint id="np${order}" playOrder="${order}"><navLabel><text>${title}</text></navLabel><content src="${fileId}.xhtml"/></navPoint>`
    );
  };

  pushChapter(
    "titlepage", "Meditations — A Columnist Sample",
    `<div class="title-page"><h1>Meditations</h1><p>Marcus Aurelius</p><p>Translated by George Long (1862)</p><p><br/>A Columnist sample edition</p></div>`,
    ++n
  );
  pushChapter("intro", "About This Sample", `<p class="lead">${INTRO}</p>`, ++n);
  for (const ch of CHAPTERS) {
    const inner = ch.body.map((p) => `<p>${p}</p>`).join("\n");
    pushChapter(`ch${n}`, ch.title, inner, ++n);
  }

  const ncx = `<?xml version="1.0" encoding="utf-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n<head><meta name="dtb:uid" content="columnist-sample-meditations"/></head>\n<docTitle><text>Meditations — A Columnist Sample</text></docTitle>\n<navMap>\n${ncxPoints.join("\n")}\n</navMap>\n</ncx>`;
  zip.file("OEBPS/toc.ncx", ncx);

  const opf = `<?xml version="1.0" encoding="utf-8"?>\n<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="2.0">\n<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n<dc:title>Meditations — A Columnist Sample</dc:title>\n<dc:creator>Marcus Aurelius</dc:creator>\n<dc:language>en</dc:language>\n<dc:identifier id="uid">columnist-sample-meditations</dc:identifier>\n</metadata>\n<manifest>\n${manifestItems.join("\n")}\n</manifest>\n<spine toc="ncx">\n${spineItems.join("\n")}\n</spine>\n</package>`;
  zip.file("OEBPS/content.opf", opf);

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  writeFileSync(OUT, buf);
  console.log(`Wrote ${OUT} (${(buf.length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
