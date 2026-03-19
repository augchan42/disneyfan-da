#!/usr/bin/env node
/**
 * Dragon Adventures Wiki Scraper
 *
 * Scrapes Fandom wiki pages using Playwright + Readability,
 * outputs clean markdown files.
 *
 * Usage:
 *   node scrape.mjs <wiki-page-name> [output-file]
 *   node scrape.mjs Veidreki                    # -> veidreki-wiki.md
 *   node scrape.mjs Veidreki_Live_Event          # -> veidreki-live-event-wiki.md
 *   node scrape.mjs Potions potions-wiki.md       # explicit output name
 *
 * Batch mode (scrape multiple pages):
 *   node scrape.mjs --batch Veidreki Potions Trading Mutations
 */

import { chromium } from "playwright";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { writeFileSync } from "fs";

const WIKI_BASE = "https://dragon-adventures.fandom.com/wiki/";

function htmlToMarkdown(html) {
  // Simple HTML-to-markdown conversion for wiki content
  let md = html;

  // Remove images (keep alt text if useful)
  md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, "");
  md = md.replace(/<img[^>]*>/gi, "");

  // Convert headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1");
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1");

  // Convert links - keep wiki links as text, external as markdown links
  md = md.replace(
    /<a[^>]*href="\/wiki\/([^"]*)"[^>]*>(.*?)<\/a>/gi,
    "$2"
  );
  md = md.replace(
    /<a[^>]*href="(https?:\/\/[^"]*)"[^>]*>(.*?)<\/a>/gi,
    "[$2]($1)"
  );
  md = md.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");

  // Convert bold/italic
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");

  // Convert lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1");
  md = md.replace(/<\/?[uo]l[^>]*>/gi, "");

  // Convert paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

  // Convert line breaks
  md = md.replace(/<br\s*\/?>/gi, "\n");

  // Convert tables - extract caption, rows, and add separator
  md = md.replace(/<caption[^>]*>(.*?)<\/caption>/gis, "**$1**\n\n");
  md = md.replace(/<table[^>]*>/gi, "\n");
  md = md.replace(/<\/table>/gi, "\n");
  md = md.replace(/<thead[^>]*>/gi, "");
  md = md.replace(/<\/thead>/gi, "");
  md = md.replace(/<tbody[^>]*>/gi, "");
  md = md.replace(/<\/tbody>/gi, "");

  // Convert rows, tracking if we need a separator after the first row
  let isFirstRow = true;
  md = md.replace(/<tr[^>]*>(.*?)<\/tr>/gis, (_, row) => {
    const cells = [];
    const cellRegex = /<t[hd][^>]*>(.*?)<\/t[hd]>/gis;
    let match;
    while ((match = cellRegex.exec(row)) !== null) {
      cells.push(match[1].replace(/\n/g, " ").trim());
    }
    if (cells.length === 0) return "";
    let line = "| " + cells.join(" | ") + " |\n";
    if (isFirstRow) {
      isFirstRow = false;
      line += "| " + cells.map(() => "---").join(" | ") + " |\n";
    }
    return line;
  });

  // Remove superscript references like [1], [2]
  md = md.replace(/<sup[^>]*>.*?<\/sup>/gi, "");

  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#039;/g, "'");
  md = md.replace(/&nbsp;/g, " ");

  // Remove empty markdown links like [](url)
  md = md.replace(/\[]\([^)]*\)/g, "");

  // Clean up table formatting - remove blank lines between table rows
  md = md.replace(/\|\n\n\|/g, "|\n|");

  // Clean up whitespace
  md = md.replace(/\n{3,}/g, "\n\n");
  md = md.trim();

  return md;
}

async function scrapePage(pageName, outputFile) {
  const url = WIKI_BASE + encodeURIComponent(pageName);
  const outName =
    outputFile || pageName.toLowerCase().replace(/_/g, "-") + "-wiki.md";

  console.log(`Scraping: ${url}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Give Fandom JS time to render the page content
  await page.waitForTimeout(3000);

  // Wait for the actual wiki content to render
  await page.waitForSelector("#mw-content-text .mw-parser-output", { timeout: 10000 }).catch(() => null);

  // Extract the main content HTML from the wiki article
  const contentHtml = await page.evaluate(() => {
    // Remove elements we don't want
    const selectors = [
      ".page-header__categories",
      ".mw-editsection",
      "#toc",
      ".navbox",
      ".article-comments",
      ".ArticleAnonymousComments_anonymousCommentsSection__tQcO0",
      ".pi-image",
      ".wikia-gallery",
      "sup.reference",
      ".mbox-image",
      ".mbox-text",
      "figure.thumb",
      ".noprint",
      ".fandom-ad-wrapper",
      "script",
      "noscript",
      "#tooltip-storage",
      ".mw-collapsible-toggle",
    ];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((el) => el.remove());
    }

    // Try .mw-parser-output first (inside #mw-content-text), then fallback
    const content =
      document.querySelector("#mw-content-text .mw-parser-output") ||
      document.querySelector(".mw-parser-output") ||
      document.querySelector("#mw-content-text") ||
      document.querySelector(".page-content");
    if (!content) return null;
    return content.innerHTML;
  });

  await browser.close();

  if (!contentHtml) {
    console.error(`  No content found for "${pageName}" (page may not exist)`);
    return null;
  }

  // Use Readability for a cleaner extraction as fallback/comparison
  const dom = new JSDOM(`<html><body>${contentHtml}</body></html>`, {
    url: url,
  });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  // Convert to markdown
  let markdown;
  if (article && article.content) {
    markdown = htmlToMarkdown(article.content);
  } else {
    markdown = htmlToMarkdown(contentHtml);
  }

  // Add source header
  const header = `# ${pageName.replace(/_/g, " ")}\n\n*Source: ${url}*\n\n---\n\n`;
  markdown = header + markdown;

  writeFileSync(outName, markdown);
  console.log(`  Saved: ${outName} (${markdown.length} chars)`);
  return outName;
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`Usage:
  node scrape.mjs <WikiPageName> [output.md]
  node scrape.mjs --batch Page1 Page2 Page3

Examples:
  node scrape.mjs Veidreki
  node scrape.mjs Veidreki_Live_Event veidreki-event-wiki.md
  node scrape.mjs --batch Veidreki Potions Trading Mutations Breeding`);
  process.exit(0);
}

if (args[0] === "--batch") {
  const pages = args.slice(1);
  console.log(`Batch scraping ${pages.length} pages...\n`);
  for (const pageName of pages) {
    await scrapePage(pageName);
  }
  console.log("\nDone!");
} else {
  await scrapePage(args[0], args[1]);
}
