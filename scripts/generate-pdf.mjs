import puppeteer from "puppeteer";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, "..", "public", "HolarHR-User-Guide.html");
const pdfPath = resolve(__dirname, "..", "public", "HolarHR-User-Guide.pdf");

const html = readFileSync(htmlPath, "utf8");

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle0" });

await page.pdf({
  path: pdfPath,
  format: "A4",
  margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
  printBackground: true,
});

await browser.close();
console.log("PDF generated:", pdfPath);
