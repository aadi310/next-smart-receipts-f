"use client";

/**
 * NEXT x RDEP: Smart receipt v3, "After Hours"
 *
 * Rounded, playful, mobile first. Black + paper with soft apricot, lilac and mint accents (no neon).
 * Opened IN STORE right after billing, so every action happens at the counter or on the shop floor.
 * Nothing sends the shopper online.
 *
 * FLOW
 *   Hero      Thank you, total paid, QR, points earned, shortcut bubbles
 *   Receipt   Your bag: items, totals, payment, History / Email / Download
 *   Rate      How was your visit, then the "Inside NEXT" video
 *   Profile   Details form (collapsible, open by default)
 *   Points    NEXT Club card and progress to the next tier
 *   Coupons   Tabs: Expiring soon / All / Member perks / New. "Use in store" opens a barcode sheet
 *   Save more Shop more, save more slider
 *   Refer     One link: copy or share
 *   Gift      Pick an amount, pay at the counter
 *   Store     Directions, exchange policy, contact, tax info
 *
 * NAVIGATION (thumb friendly)
 *   1. Bottom dock with four destinations: Receipt, Rewards, Offers, Store. A sliding highlight follows scroll-spy.
 *   2. When the active destination has several sections, a small pill row pops above the dock
 *      (Receipt: Bill / Rate / Profile, Rewards: Points / Coupons, Offers: Save more / Refer / Gift card).
 *   3. Hero bubbles jump straight to Coupons / Save more / Refer / Gift.
 *   4. Thin progress line at the very top of the screen.
 *
 * Phone first: designed at 400px wide. On phones (<= 520px) it is scaled with CSS `zoom`, on larger screens
 * it stays a centred 400px column. Sections fade up as they scroll in (pure CSS, no JS, off for reduced motion).
 *
 * FONT: drop the NEXT font files into /public/fonts as "NextSans-Regular.ttf" (400) and "NextSans-Bold.ttf" (700).
 *       Until they exist the page falls back to Jost (next/font/google).
 * ASSETS: /images/design-mode/next-logo.png (black logo on transparent, used inverted on dark),
 *         /images/design-mode/RDEP-logo.png. Both fall back to text if missing.
 *
 * Usage:  app/next-receipt/page.tsx
 *   import NextReceipt from "@/components/NextReceipt";
 *   export default function Page() { return <NextReceipt />; }
 *
 * With real data: <NextReceipt receipts={[...]} data={currentReceipt} />
 *   Optional on each receipt: `club` (tier, points, coupons), `referral` ({ code, link?, rewardPoints }), `ladder`.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import Image from "next/image";
import { Jost } from "next/font/google";

const fallbackFont = Jost({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--font-nx-fallback" });
const BRAND_STACK = `"NextSans", var(--font-nx-fallback), Arial, "Helvetica Neue", Helvetica, sans-serif`;

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const FONT_FACES = `
@font-face{font-family:"NextSans";font-weight:400;font-style:normal;font-display:swap;src:url("/fonts/NextSans-Regular.ttf") format("truetype")}
@font-face{font-family:"NextSans";font-weight:700;font-style:normal;font-display:swap;src:url("/fonts/NextSans-Bold.ttf") format("truetype")}
.nx-root{font-family:${BRAND_STACK}}
.nx-bold{font-family:${BRAND_STACK};font-weight:700}

/* Phone press feedback */
.nx-root a,.nx-root button{-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.nx-root a,.nx-root button:not(:disabled){transition:transform .14s ease,background-color .2s ease,color .2s ease,border-color .2s ease,opacity .2s ease}
.nx-root a:active,.nx-root button:not(:disabled):active{transform:scale(.96)}

.nx-grain{position:relative}
.nx-grain::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:${GRAIN};opacity:.1;mix-blend-mode:overlay;border-radius:inherit}

@keyframes nx-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.nx-rise{opacity:0;animation:nx-rise .7s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes nx-float{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-10px,14px) scale(1.06)}}
.nx-float{animation:nx-float 9s ease-in-out infinite}
@keyframes nx-spin{to{transform:rotate(360deg)}}
.nx-spin{animation:nx-spin 16s linear infinite}
@keyframes nx-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.nx-marquee{animation:nx-marquee 26s linear infinite}
@keyframes nx-pulse{0%{box-shadow:0 0 0 0 rgba(255,91,58,.7)}100%{box-shadow:0 0 0 8px rgba(255,91,58,0)}}
.nx-pulse{animation:nx-pulse 1.4s ease-out infinite}
@keyframes nx-sheen{0%,55%{left:-60%}100%{left:130%}}
.nx-sheen{position:relative;overflow:hidden}
.nx-sheen::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:40%;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-18deg);animation:nx-sheen 5s ease-in-out infinite}
@keyframes nx-star-flash{0%,100%{transform:scale(1)}45%{transform:scale(1.22)}}
.nx-star-flash{animation:nx-star-flash 1.6s ease-in-out infinite}
@keyframes nx-pop{from{opacity:0;transform:translateY(24px) scale(.9)}to{opacity:1;transform:none}}
.nx-pop{animation:nx-pop .38s cubic-bezier(.2,.9,.3,1.2) both}
@keyframes nx-tab{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
.nx-tab{animation:nx-tab .35s cubic-bezier(.2,.7,.2,1) both}

.nx-range{-webkit-appearance:none;appearance:none;height:10px;border-radius:999px;outline:none;width:100%}
.nx-range::-webkit-slider-thumb{-webkit-appearance:none;width:32px;height:32px;border-radius:50%;background:#fff;border:7px solid var(--nx-glow);box-shadow:0 6px 16px rgba(0,0,0,.5);cursor:grab}
.nx-range::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:7px solid var(--nx-glow);box-shadow:0 6px 16px rgba(0,0,0,.5)}

@keyframes nx-reveal{from{opacity:0;transform:translateY(34px) scale(.97)}to{opacity:1;transform:none}}
@supports (animation-timeline:view()){.nx-reveal{animation:nx-reveal linear both;animation-timeline:view();animation-range:entry 0% entry 28%}}

@media (prefers-reduced-motion:reduce){
  .nx-reveal{animation:none!important}
  .nx-rise{opacity:1;animation:none}
  .nx-float,.nx-spin,.nx-marquee,.nx-pulse,.nx-star-flash,.nx-pop,.nx-tab{animation:none}
  .nx-sheen::after{animation:none;display:none}
  .nx-root a,.nx-root button:not(:disabled){transition:none}
  .nx-root a:active,.nx-root button:not(:disabled):active{transform:none}
}
`;

/* Black, paper and soft accents: apricot (glow), lilac, mint, with coral only for urgency. */
const theme = {
  "--nx-black": "#0B0B0C",
  "--nx-ink2": "#17171A",
  "--nx-paper": "#F1EEE8",
  "--nx-gray": "#5E5E63",
  "--nx-mid": "#94949A",
  "--nx-line": "rgba(11,11,12,0.12)",
  "--nx-glow": "#FFBE9A",
  "--nx-peach-soft": "#F9E1D3",
  "--nx-lilac": "#C9B8FF",
  "--nx-lilac-soft": "#E4DBFF",
  "--nx-mint": "#BEEBD3",
  "--nx-coral": "#FF5B3A",
} as CSSProperties;

/* Type scale */
const CAPS = "text-[11px] uppercase tracking-[0.16em] leading-snug";
const BODY = "text-[14px] leading-snug";
const SMALL = "text-[12px] leading-snug";
const LABEL = "nx-bold text-[14px] leading-snug";
const AMOUNT = "nx-bold text-[16px] leading-snug tabular-nums";

/* Assets + links (override with props) */
const DEFAULT_NEXT_LOGO = "/images/design-mode/next-logo.png";
const DEFAULT_RDEP_LOGO = "/images/design-mode/RDEP-logo.png";
const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/nextofficial/";
const DEFAULT_STORE_LOCATOR_URL = "https://www.robustkommerce.com/stores?brand=next";
const MARKETING_VIDEO_ID = "8kRn-E-VjMA";

/* Club tiers. `foil` is the metallic gradient used on the Club card and the hero chip. */
export type TierName = "Silver" | "Gold" | "Platinum";
const TIERS: { name: TierName; foil: string }[] = [
  { name: "Silver", foil: "linear-gradient(120deg,#FFFFFF 0%,#C9CED6 35%,#8D949E 62%,#EEF0F3 100%)" },
  { name: "Gold", foil: "linear-gradient(120deg,#FFF3C4 0%,#E5BD52 38%,#A67C1A 62%,#F7E08F 100%)" },
  { name: "Platinum", foil: "linear-gradient(120deg,#FFFFFF 0%,#D6E2F2 32%,#93A9C9 62%,#F1F6FD 100%)" },
];

/* ------------------------------- types ------------------------------------------- */
export interface NextItem {
  name: string;
  size: string;
  sku: string;
  hsn: string;
  qty: number;
  mrp: number;
  discount: number;
}

export type CouponKind = "offer" | "member" | "birthday";
export interface NextCoupon {
  code: string;
  /** Big headline, e.g. "20% OFF" or "₹500 OFF" */
  value: string;
  title: string;
  description: string;
  /** Display text, e.g. "30 Nov 2026" */
  validTill: string;
  /** ISO date (yyyy-mm-dd). Drives the countdown and the "Expiring soon" tab (7 days or less). */
  expiresOn: string;
  kind: CouponKind;
  /** Shows in the "New" tab */
  isNew?: boolean;
}

export interface NextClub {
  tier: TierName;
  points: number;
  /** Points still needed for the next tier. null / omitted at the top tier. */
  pointsToNext?: number | null;
  /** Points earned on this bill. If omitted it is worked out as 1 point per ₹10. */
  pointsEarned?: number;
  coupons: NextCoupon[];
}

export interface NextReferral {
  code: string;
  /** Shareable join link. If omitted a sample link is built from the code. */
  link?: string;
  /** Points the shopper AND the friend each get */
  rewardPoints: number;
}

export interface LadderStep {
  /** Minimum single-bill spend in ₹ */
  spend: number;
  title: string;
  percent: number;
  perk: string;
}
export interface NextLadder {
  validTill: string;
  steps: LadderStep[];
}

export interface NextReceiptData {
  invoiceNo: string;
  date: string;
  customer: { name: string; mobile: string; email: string };
  items: NextItem[];
  sgst: number;
  cgst: number;
  payment: { mode: string; ref: string };
  store: { name: string; address: string; email: string; phone: string; gstin?: string; associate: string };
  registeredOffice: string;
  exchange: { days: number; points: string[] };
  callTo: string;
  emailTo: string;
  club?: NextClub;
  referral?: NextReferral;
  ladder?: NextLadder;
}

export interface ProfileValues {
  name: string;
  email: string;
  gender: string;
  birthday: string;
  anniversary: string;
  offers: boolean;
}

export interface FeedbackValues {
  invoiceNo: string;
  overall: number;
  categories: { service: number; product: number; sizes: number; value: number };
  comment: string;
}

export interface GiftCardValues {
  invoiceNo: string;
  amount: number;
  fromName: string;
}

export interface NextReceiptProps {
  data?: NextReceiptData;
  receipts?: NextReceiptData[];
  qrSrc?: string;
  logoSrc?: string;
  rdepLogoSrc?: string;
  instagramUrl?: string;
  storeLocatorUrl?: string;
  onDownload?: (receipt: NextReceiptData) => void;
  onSendEmail?: (email: string, receipt: NextReceiptData) => void;
  onSaveProfile?: (values: ProfileValues) => void;
  onSubmitFeedback?: (values: FeedbackValues) => void;
  onSelectReceipt?: (invoiceNo: string) => void;
  /** Called when the shopper requests a gift card. Payment is collected at the billing counter. */
  onRequestGiftCard?: (values: GiftCardValues) => void;
  onShareReferral?: (code: string) => void;
}

type IconName =
  | "history" | "mail" | "download" | "phone" | "instagram" | "pin" | "close" | "check" | "arrow" | "chevron"
  | "user" | "tax" | "directions" | "call" | "star" | "ticket" | "qr" | "bag" | "trend" | "users" | "gift"
  | "smile" | "lock" | "share" | "copy" | "clock" | "down";
type ModalId = "history" | "email" | "qr" | "coupon" | null;

interface HistoryRow {
  invoiceNo: string;
  date: string;
  storeName: string;
  amount: number;
  items: number;
  current: boolean;
}

/* ------------------------------- helpers ----------------------------------------- */
const inr = (n: number): string => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = (n: number): string => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const trim = (n: number): string => String(Number(n.toFixed(2)));
const pctText = (n: number): string => String(Math.round(n * 10) / 10);
const round2 = (n: number): number => Math.round(n * 100) / 100;
const netOf = (i: NextItem): number => round2(i.mrp * i.qty - i.discount);
const emailOk = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function totalsOf(r: NextReceiptData) {
  const subtotal = round2(r.items.reduce((a, i) => a + i.mrp * i.qty, 0));
  const discount = round2(r.items.reduce((a, i) => a + i.discount, 0));
  return { subtotal, discount, total: round2(subtotal - discount), pieces: r.items.reduce((a, i) => a + i.qty, 0) };
}

function dateValue(d: string): number {
  const [dd, mm, yyyy] = d.split(" ")[0].split("-").map(Number);
  return Date.UTC(yyyy, (mm || 1) - 1, dd || 1);
}

function seeded(seed: string): () => number {
  let s = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    s ^= seed.charCodeAt(i);
    s = Math.imul(s, 16777619);
  }
  s = s || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/** Whole days left until the end of `iso` (yyyy-mm-dd), counted from `now`. */
const daysLeft = (iso: string, now: number): number => Math.ceil((new Date(`${iso}T23:59:59`).getTime() - now) / 86400000);
const leftText = (d: number): string => (d <= 0 ? "Ends today" : d === 1 ? "1 day left" : `${d} days left`);

/** Current time, set after mount so server and client markup match. */
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/* ---------------------------- downloadable receipt ------------------------------- */
const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildReceiptHtml(r: NextReceiptData, logoSrc: string, rdepLogoSrc: string): string {
  const abs = (p: string) => (/^(https?:|data:)/.test(p) ? p : `${window.location.origin}${encodeURI(p)}`);
  const t = totalsOf(r);
  const rows = r.items
    .map(
      (i) => `<tr>
      <td><div class="n">${esc(i.name)}</div><div class="s">Size ${esc(i.size)} &middot; SKU ${esc(i.sku)} &middot; HSN ${esc(i.hsn)}</div></td>
      <td class="r">${i.qty}</td><td class="r">${inr(i.mrp)}</td><td class="r">&minus;${inr(i.discount)}</td><td class="r b">${inr(netOf(i))}</td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>NEXT Receipt ${esc(r.invoiceNo)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,'Helvetica Neue',sans-serif;font-size:14px;color:#5E5E63;background:#F1EEE8;max-width:760px;margin:0 auto;padding:24px}
.bar{display:flex;justify-content:flex-end;margin-bottom:16px}
.bar button{background:#0B0B0C;color:#fff;border:0;border-radius:999px;padding:11px 20px;font:700 12px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.sheet{background:#fff;border-radius:28px;padding:28px}
.head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding-bottom:16px;border-bottom:3px solid #0B0B0C}
.head img{height:30px;width:auto}
h1{font-size:20px;color:#0B0B0C;text-transform:uppercase;letter-spacing:.14em;margin-top:12px}
.meta{text-align:right;font-size:12px;line-height:1.8}
table{width:100%;border-collapse:collapse;margin-top:20px}
th{text-align:left;font-size:11px;letter-spacing:.14em;padding:8px;background:#F1EEE8;border-bottom:1px solid #0B0B0C}
td{padding:12px 8px;border-bottom:1px solid rgba(11,11,12,.12);vertical-align:top;font-size:13px}
.r{text-align:right}.b{font-weight:700;color:#0B0B0C}.n{text-transform:uppercase;font-weight:700;color:#0B0B0C}.s{font-size:11px;margin-top:3px}
.sum{margin:18px 0 0 auto;width:300px}
.row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
.total{display:flex;justify-content:space-between;align-items:baseline;border-top:3px solid #0B0B0C;margin-top:10px;padding-top:12px;color:#0B0B0C;font-weight:700}
.total strong{font-size:26px}
.pay{margin-top:18px;background:#0B0B0C;color:#fff;border-radius:999px;padding:14px 20px;display:flex;justify-content:space-between;font-size:14px}
.store{margin-top:24px;font-size:12px;line-height:1.7;border-top:1px solid rgba(11,11,12,.12);padding-top:14px}
.foot{margin-top:22px;text-align:center;font-size:12px}.foot img{height:20px;vertical-align:middle;margin-left:6px}
@media print{.bar{display:none}body{max-width:none;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="bar"><button onclick="window.print()">Save as PDF</button></div>
<div class="sheet">
<div class="head"><div><img src="${esc(abs(logoSrc))}" alt="NEXT" onerror="this.style.display='none'"><h1>Tax invoice</h1></div>
<div class="meta"><div><b>Invoice no:</b> ${esc(r.invoiceNo)}</div><div><b>Date:</b> ${esc(r.date)}</div><div><b>Customer:</b> ${esc(r.customer.name)}</div><div><b>Mobile:</b> ${esc(r.customer.mobile)}</div></div></div>
<table><thead><tr><th style="width:44%">ITEM</th><th class="r">QTY</th><th class="r">UNIT PRICE</th><th class="r">DISCOUNT</th><th class="r">NET AMOUNT</th></tr></thead><tbody>${rows}</tbody></table>
<div class="sum">
<div class="row"><span>Subtotal (MRP)</span><b>&#8377;${inr(t.subtotal)}</b></div>
<div class="row"><span>Discount</span><b>&minus;&#8377;${inr(t.discount)}</b></div>
<div class="row"><span>Includes SGST</span><b>&#8377;${inr(r.sgst)}</b></div>
<div class="row"><span>Includes CGST</span><b>&#8377;${inr(r.cgst)}</b></div>
<div class="total"><span>Total paid</span><strong>&#8377;${inr(t.total)}</strong></div></div>
<div class="pay"><span>Payment method &middot; ${esc(r.payment.mode)} &ndash; ${esc(r.payment.ref)}</span><b>&#8377;${inr(t.total)}</b></div>
<div class="store"><b>${esc(r.store.name)}</b><br>${esc(r.store.address)}<br>${esc(r.store.email)} &middot; ${esc(r.store.phone)}${r.store.gstin ? `<br>GSTIN: ${esc(r.store.gstin)}` : ""}<br>Registered office: ${esc(r.registeredOffice)}</div>
<div class="foot">Thank you for shopping at NEXT<br><br>Powered by <img src="${esc(abs(rdepLogoSrc))}" alt="rdep" onerror="this.style.display='none'"></div>
</div></body></html>`;
}

function downloadReceipt(r: NextReceiptData, logoSrc: string, rdepLogoSrc: string) {
  const blob = new Blob([buildReceiptHtml(r, logoSrc, rdepLogoSrc)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NEXT_Receipt_${r.invoiceNo}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* -------------------------------- Sample Data ----------------------------------- */
const halfTax = (total: number): number => Math.floor(((total - total / 1.18) / 2) * 100) / 100;

/* SAMPLE data. Replace with the real tier, points, coupons, referral and ladder from the NEXT loyalty API. */
const SAMPLE_CLUB: NextClub = {
  tier: "Gold",
  points: 3240,
  pointsToNext: 1760,
  coupons: [
    { code: "GOLD500", value: "₹500 OFF", title: "Gold member reward", description: "On any bill above ₹2,999.", validTill: "3 Nov 2026", expiresOn: "2026-11-03", kind: "member" },
    { code: "NEXT20", value: "20% OFF", title: "Welcome back offer", description: "On your next purchase of ₹3,999 or more.", validTill: "4 Nov 2026", expiresOn: "2026-11-04", kind: "offer" },
    { code: "FESTIVE10", value: "10% OFF", title: "Festive edit", description: "On new arrivals. One use only.", validTill: "15 Nov 2026", expiresOn: "2026-11-15", kind: "offer", isNew: true },
    { code: "WINTER15", value: "15% OFF", title: "Winter wardrobe", description: "On jackets, knits and layering pieces.", validTill: "30 Nov 2026", expiresOn: "2026-11-30", kind: "offer", isNew: true },
    { code: "GOLDTOTE", value: "FREE TOTE", title: "Gold perk", description: "A NEXT tote on any bill above ₹5,999.", validTill: "31 Dec 2026", expiresOn: "2026-12-31", kind: "member", isNew: true },
  ],
};

const SAMPLE_LADDER: NextLadder = {
  validTill: "30 Nov 2026",
  steps: [
    { spend: 4999, title: "Style starter", percent: 5, perk: "+100 bonus points" },
    { spend: 9999, title: "Wardrobe refresh", percent: 10, perk: "+300 bonus points" },
    { spend: 14999, title: "The full look", percent: 15, perk: "Free NEXT tote + 600 bonus points" },
  ],
};

const SAMPLE_COMMON = {
  customer: { name: "Sunil", mobile: "7975331947", email: "lekha.s@proenx.com" },
  store: {
    name: "Next",
    address: "Laxmi Society, Model Colony, Shivajinagar, Maharashtra",
    email: "rema.k@proenx.com",
    phone: "9790258564",
    associate: "Rohit",
  },
  registeredOffice:
    "1/1, 4th Floor, Cabin 1, Vinayaka Towers, Gandhinagar, K. G. Road, Bangalore, Bangalore North, Karnataka, India, 560009",
  exchange: {
    days: 30,
    points: [
      "Items can be exchanged within 30 days of purchase with this receipt.",
      "Products must be unworn, unwashed and carry all original tags.",
      "Exchange is for the same or a higher value item; any price difference is payable.",
      "Items bought during the end of season sale, innerwear and accessories are not exchangeable.",
    ],
  },
  callTo: "+919790258564",
  emailTo: "rema.k@proenx.com",
  club: SAMPLE_CLUB,
  referral: { code: "SUNIL-NXT500", rewardPoints: 500 } as NextReferral,
  ladder: SAMPLE_LADDER,
};

export const sampleNextReceipts: NextReceiptData[] = [
  {
    ...SAMPLE_COMMON,
    invoiceNo: "20260626000169",
    date: "31-10-2026 18:18:04",
    items: [{ name: "BLEACH BLUE DENIM BAGGY FIT JEANS", size: "L", sku: "V16-027", hsn: "62032090", qty: 1, mrp: 3033, discount: 150.65 }],
    sgst: 219.84,
    cgst: 219.84,
    payment: { mode: "CASH", ref: "REF98765" },
  },
  {
    ...SAMPLE_COMMON,
    invoiceNo: "20260526000112",
    date: "26-05-2026 18:41:22",
    store: { ...SAMPLE_COMMON.store, name: "Next Pavilion Mall", address: "Pavilion Mall, Senapati Bapat Road, Pune, Maharashtra" },
    items: [
      { name: "RELAXED FIT STRAIGHT JEANS", size: "32", sku: "V12-310", hsn: "62034200", qty: 1, mrp: 3490, discount: 500 },
      { name: "TEXTURED COTTON T-SHIRT", size: "M", sku: "T07-118", hsn: "61091000", qty: 2, mrp: 1290, discount: 0 },
    ],
    sgst: halfTax(5570),
    cgst: halfTax(5570),
    payment: { mode: "CARD", ref: "REF40211" },
  },
  {
    ...SAMPLE_COMMON,
    invoiceNo: "20260203000047",
    date: "03-02-2026 14:09:50",
    store: { ...SAMPLE_COMMON.store, name: "Next Phoenix Mall of Asia", address: "Phoenix Mall of Asia, Yelahanka, Bengaluru, Karnataka" },
    items: [{ name: "BELTED MIDI DRESS", size: "S", sku: "D21-905", hsn: "62044990", qty: 1, mrp: 4990, discount: 0 }],
    sgst: halfTax(4990),
    cgst: halfTax(4990),
    payment: { mode: "UPI", ref: "REF77310" },
  },
];

/* -------------------------------- icons ------------------------------------------ */
const STAR_PATH = "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z";
const PHONE_PATH =
  "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z";
const PATHS: Record<IconName, ReactNode> = {
  history: (<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></>),
  download: (<><path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></>),
  phone: <path d={PHONE_PATH} />,
  call: <path d={PHONE_PATH} />,
  instagram: (<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>),
  pin: (<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>),
  user: (<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  tax: (<><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 8h10M7 12h10M7 16h6" /></>),
  directions: <path d="M9 18l6-6-6-6" />,
  star: <path d={STAR_PATH} />,
  ticket: (<><path d="M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 1 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" /><path d="M9 9h6M9 12h6M9 15h3" /></>),
  qr: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 18v3" /></>),
  bag: (<><path d="M6 7h12l1 13H5L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" /></>),
  trend: (<><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>),
  gift: (<><rect x="3" y="8" width="18" height="4" rx="1.5" /><path d="M12 8v13" /><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" /><path d="M7.5 8a2.5 2.5 0 1 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 1 1 0 5" /></>),
  smile: (<><circle cx="12" cy="12" r="9" /><path d="M8 14a4.5 4.5 0 0 0 8 0" /><path d="M9 9.5h.01M15 9.5h.01" /></>),
  lock: (<><rect x="5" y="11" width="14" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  share: (<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>),
  copy: (<><rect x="9" y="9" width="12" height="12" rx="3" /><path d="M5 15V6a3 3 0 0 1 3-3h9" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m5 12 5 5 9-10" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
};

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/* ------------------------- placeholder QR + decorative barcode ------------------- */
function PlaceholderQR({ seed }: { seed: string }) {
  const N = 25;
  const cells = useMemo(() => {
    const rnd = seeded(seed);
    const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
    const out: [number, number][] = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rnd() > 0.5) out.push([x, y]);
    return out;
  }, [seed]);
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} fill="#0B0B0C" shapeRendering="crispEdges" role="img" aria-label="QR code" className="h-full w-full">
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
      ))}
      {finder(0, 0)}
      {finder(N - 7, 0)}
      {finder(0, N - 7)}
    </svg>
  );
}

/** Decorative barcode (replace with a real one at the till integration). Takes the surrounding text colour. */
function Barcode({ seed, className = "" }: { seed: string; className?: string }) {
  const bars = useMemo(() => {
    const rnd = seeded(seed);
    const out: { x: number; w: number }[] = [];
    let x = 0;
    while (x < 96) {
      const w = rnd() > 0.6 ? 3 : rnd() > 0.4 ? 2 : 1;
      if (rnd() > 0.28) out.push({ x, w });
      x += w + (rnd() > 0.5 ? 2 : 1);
    }
    return out;
  }, [seed]);
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" fill="currentColor" aria-hidden="true" className={className}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height="30" />
      ))}
    </svg>
  );
}

/** Circular text that spins around a centre. */
function SpinRing({ text, className = "" }: { text: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className}>
      <defs>
        <path id={id} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
      </defs>
      <text fontSize="11" fontWeight="700" fill="currentColor">
        <textPath href={`#${id}`} textLength="272" lengthAdjust="spacing">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

/* --------------------------------- shared ---------------------------------------- */
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nx-black)]";
const card = "rounded-[32px] border border-black/[0.06] bg-white shadow-[0_18px_40px_-26px_rgba(11,11,12,0.5)]";
const fieldInput =
  "w-full rounded-2xl border border-[var(--nx-line)] bg-[var(--nx-paper)] px-4 py-3.5 text-base text-[var(--nx-black)] outline-none transition-colors [-webkit-appearance:none] [appearance:none] placeholder:text-[var(--nx-mid)] focus:border-[var(--nx-black)] focus:bg-white";
const fieldLabel = `${CAPS} mb-1.5 block text-[var(--nx-gray)]`;
const solidBtn = `nx-bold flex w-full items-center justify-center gap-2 rounded-full bg-[var(--nx-black)] py-4 text-[13px] uppercase tracking-[0.14em] text-white active:bg-[var(--nx-gray)] [@media(hover:hover)]:hover:bg-[var(--nx-gray)] ${focusRing}`;
const glowBtn = `nx-bold flex w-full items-center justify-center gap-2 rounded-full bg-[var(--nx-glow)] py-4 text-[13px] uppercase tracking-[0.14em] text-[var(--nx-black)] active:brightness-90 ${focusRing}`;
const ghostBtn = `nx-bold inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--nx-black)] px-5 py-3 text-[12px] uppercase tracking-[0.12em] text-[var(--nx-black)] active:bg-[var(--nx-black)] active:text-white [@media(hover:hover)]:hover:bg-[var(--nx-black)] [@media(hover:hover)]:hover:text-white ${focusRing}`;

const DESIGN_W = 400;
const PHONE_MAX = 520;
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useFitScale(): number {
  const [scale, setScale] = useState(1);
  useIsoLayoutEffect(() => {
    const update = () => {
      const w = document.documentElement.clientWidth;
      setScale(w <= PHONE_MAX ? w / DESIGN_W : 1);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  return scale;
}
const zoomStyle = (scale: number): CSSProperties | undefined => (scale === 1 ? undefined : ({ zoom: scale } as CSSProperties));

function useInView<T extends Element>(ref: RefObject<T | null>, rootMargin: string, threshold: number): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin, threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold]);
  return inView;
}

function useCopy() {
  const [copied, setCopied] = useState("");
  const copy = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      /* clipboard blocked: ignore */
    }
  }, []);
  return { copied, copy };
}

const jumpTo = (id: string) => document.getElementById(`nx-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

function BrandImage({
  src, alt, width, height, className, fallbackClassName, priority = false,
}: {
  src: string; alt: string; width: number; height: number; className: string; fallbackClassName: string; priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={fallbackClassName}>{alt}</span>;
  return (
    <Image
      ref={(img: HTMLImageElement | null) => {
        if (img && img.complete && img.naturalWidth === 0) setFailed(true);
      }}
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

function Collapse({ open, id, children }: { open: boolean; id: string; children: ReactNode }) {
  return (
    <div
      id={id}
      aria-hidden={!open}
      className={`grid transition-[grid-template-rows,visibility] duration-300 motion-reduce:transition-none ${open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"}`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

/** Chapter header: small label chip + big title. `dark` flips the colours for dark panels. */
function ChapterHead({ label, title, sub, dark = false }: { label: string; title: ReactNode; sub?: string; dark?: boolean }) {
  return (
    <div>
      <span className={`nx-bold inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${CAPS} ${dark ? "bg-white/10 text-white" : "bg-[rgba(11,11,12,0.07)] text-[var(--nx-black)]"}`}>
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-[var(--nx-glow)]" : "bg-[var(--nx-coral)]"}`} />
        {label}
      </span>
      <h2 className={`nx-bold mt-3 text-[34px] uppercase leading-[0.95] tracking-[-0.025em] ${dark ? "text-white" : "text-[var(--nx-black)]"}`}>{title}</h2>
      {sub && <p className={`mt-3 ${BODY} ${dark ? "text-white/70" : "text-[var(--nx-gray)]"}`}>{sub}</p>}
    </div>
  );
}

/* Popups: rounded bottom sheets */
function Modal({ title, onClose, scale, children, dark = false }: { title: string; onClose: () => void; scale: number; children: ReactNode; dark?: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      (previous as HTMLElement | null)?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B0B0C]/70 backdrop-blur-[3px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={theme}
        className={`nx-root nx-pop ${fallbackFont.variable} max-h-[90vh] w-full overflow-y-auto rounded-t-[36px] outline-none sm:w-[400px] sm:rounded-[36px] ${dark ? "bg-[var(--nx-black)] text-white" : "bg-white text-[var(--nx-gray)]"}`}
      >
        <div className="w-full sm:w-[400px]" style={zoomStyle(scale)}>
          <div className="p-6 pt-3">
            <span aria-hidden="true" className={`mx-auto mb-4 block h-1.5 w-12 rounded-full ${dark ? "bg-white/25" : "bg-black/15"}`} />
            <div className="flex items-center justify-between gap-4">
              <h2 id={titleId} className={`nx-bold text-[22px] uppercase leading-tight tracking-[-0.01em] ${dark ? "text-white" : "text-[var(--nx-black)]"}`}>
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${dark ? "bg-white/10 text-white" : "bg-[var(--nx-paper)] text-[var(--nx-black)]"} ${focusRing}`}
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ 01 receipt: item row ----------------------------- */
function ItemRow({ item, open, onToggle }: { item: NextItem; open: boolean; onToggle: () => void }) {
  const panelId = useId();
  const net = netOf(item);
  const gross = item.mrp * item.qty;
  const pct = gross > 0 ? (item.discount / gross) * 100 : 0;
  const facts: [string, string][] = [
    ["SKU", item.sku],
    ["HSN", item.hsn],
    ["UoM", "Pcs"],
    ["Unit price", `₹${inr(item.mrp)}`],
    ["Discount", `${pctText(pct)}%`],
    ["Amount", `₹${trim(item.discount)}`],
  ];
  return (
    <li className="border-t border-dashed border-black/15 first:border-t-0">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId} className={`grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-start gap-x-3 py-4 text-left ${focusRing}`}>
        <span aria-label={`Size ${item.size}`} className="nx-bold grid h-12 w-12 place-items-center rounded-full bg-[var(--nx-black)] text-[15px] text-white">
          {item.size}
        </span>
        <span className="min-w-0">
          <span className="nx-bold block text-[14px] uppercase leading-snug tracking-[0.02em] text-[var(--nx-black)]">{item.name}</span>
          <span className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 ${SMALL} text-[var(--nx-gray)]`}>
            <span>Qty {item.qty}</span>
            {pct > 0 && <span className="nx-bold rounded-full bg-[var(--nx-glow)] px-2 py-0.5 text-black">{pctText(pct)}% off</span>}
            <span className="nx-bold flex items-center gap-1 text-[var(--nx-black)]">
              Details
              <Icon name="chevron" className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
            </span>
          </span>
        </span>
        <span className="text-right">
          <span className={`${AMOUNT} block text-[var(--nx-black)]`}>₹{inr(net)}</span>
          {item.discount > 0 && <s className={`mt-0.5 block ${SMALL} tabular-nums text-[var(--nx-mid)]`}>₹{inr(gross)}</s>}
        </span>
      </button>
      <Collapse open={open} id={panelId}>
        <dl className="grid grid-cols-3 gap-2 pb-4">
          {facts.map(([k, v]) => (
            <div key={k} className="min-w-0 rounded-2xl bg-[var(--nx-paper)] p-3">
              <dt className={`${CAPS} text-[10px] text-[var(--nx-gray)]`}>{k}</dt>
              <dd className="nx-bold mt-1 break-words text-[13px] tabular-nums text-[var(--nx-black)]">{v}</dd>
            </div>
          ))}
        </dl>
      </Collapse>
    </li>
  );
}

/* ------------------------------ 02 points: club card ----------------------------- */
function ClubCard({ club, mobile, earned, logoSrc }: { club: NextClub; mobile: string; earned: number; logoSrc: string }) {
  const idx = Math.max(0, TIERS.findIndex((t) => t.name === club.tier));
  const tier = TIERS[idx];
  const next = TIERS[idx + 1];
  const toNext = club.pointsToNext ?? null;
  const total = toNext != null ? club.points + toNext : club.points;
  const pct = !next || toNext == null || total <= 0 ? 100 : Math.min(100, Math.round((club.points / total) * 100));

  return (
    <div className="nx-sheen rounded-[36px] p-5 text-[var(--nx-black)] shadow-[0_30px_50px_-24px_rgba(11,11,12,0.8)]" style={{ backgroundImage: tier.foil }}>
      <svg aria-hidden="true" viewBox="0 0 368 220" preserveAspectRatio="xMaxYMin slice" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]" fill="none" stroke="#0B0B0C" strokeWidth="1">
        {[50, 80, 110, 140, 170, 200].map((r) => (
          <circle key={r} cx="330" cy="20" r={r} />
        ))}
      </svg>
      <div className="relative flex items-center justify-between gap-3">
        <BrandImage src={logoSrc} alt="NEXT" width={320} height={80} className="h-5 w-auto object-contain object-left" fallbackClassName="nx-bold text-[16px] uppercase tracking-[0.3em]" />
        <span className="nx-bold rounded-full bg-black/10 px-3 py-1 text-[12px] tabular-nums tracking-[0.14em]">•••• {mobile.slice(-4)}</span>
      </div>
      <div className="relative mt-6 flex items-end justify-between gap-3">
        <div>
          <p className={`${SMALL} text-black/70`}>Club tier</p>
          <p className="nx-bold text-[44px] uppercase leading-none tracking-[-0.02em]">{tier.name}</p>
        </div>
        <div className="text-right">
          <p className="nx-bold text-[34px] leading-none tabular-nums">{inr0(club.points)}</p>
          <p className={`${SMALL} text-black/70`}>points</p>
        </div>
      </div>
      <div className="relative mt-6">
        <div className="relative h-3 rounded-full bg-black/15">
          <div className="h-full rounded-full bg-[var(--nx-black)]" style={{ width: `${pct}%` }} />
          {TIERS.map((t, i) => (
            <span key={t.name} aria-hidden="true" className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white ${i <= idx ? "bg-[var(--nx-black)]" : "bg-black/25"}`} style={{ left: `${i * 50}%`, ...(i === 2 ? { left: "calc(100% - 4px)" } : null) }} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 text-[11px] uppercase tracking-[0.12em]">
          {TIERS.map((t, i) => (
            <span key={t.name} className={`nx-bold ${i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right"} ${i === idx ? "text-black" : "text-black/50"}`}>{t.name}</span>
          ))}
        </div>
        <p className={`${BODY} mt-3`}>
          {next && toNext != null ? (
            <>
              <span className="nx-bold tabular-nums">{inr0(toNext)}</span> more points to <span className="nx-bold">{next.name}</span>
            </>
          ) : (
            "You are at the top tier"
          )}
        </p>
      </div>
      <div className="relative mt-5 flex items-center justify-between gap-3 rounded-full bg-[var(--nx-black)] py-2.5 pl-5 pr-2.5 text-white">
        <p className={SMALL}>
          Earned on this bill <span className="nx-bold text-[var(--nx-glow)]">+{inr0(earned)}</span>
        </p>
        <span className="nx-bold rounded-full bg-[var(--nx-glow)] px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-black">Today</span>
      </div>
    </div>
  );
}

/* ------------------------------ 03 coupons: tabs + cards ------------------------- */
type TabKey = "expiring" | "all" | "member" | "new";
const TABS: { key: TabKey; label: string }[] = [
  { key: "expiring", label: "Expiring soon" },
  { key: "all", label: "All" },
  { key: "member", label: "Member perks" },
  { key: "new", label: "New" },
];

const kindStyle: Record<CouponKind, { bg: string; chip: string }> = {
  offer: { bg: "bg-[var(--nx-glow)]", chip: "Offer" },
  member: { bg: "bg-[var(--nx-lilac)]", chip: "Member perk" },
  birthday: { bg: "bg-[var(--nx-coral)]", chip: "Birthday" },
};

function CouponCard({ c, left, copied, onCopy, onUse }: { c: NextCoupon; left: number | null; copied: boolean; onCopy: (code: string) => void; onUse: (c: NextCoupon) => void }) {
  const urgent = left != null && left <= 3;
  return (
    <li className="w-[82%] shrink-0 snap-center">
      <div className="relative overflow-hidden rounded-[30px] bg-white text-[var(--nx-black)]">
        <div className={`p-5 ${kindStyle[c.kind].bg}`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`nx-bold rounded-full bg-black/10 px-2.5 py-1 ${CAPS} text-[10px]`}>{c.isNew ? "New · " : ""}{kindStyle[c.kind].chip}</span>
            <span className={`nx-bold inline-flex items-center gap-1.5 rounded-full bg-[var(--nx-black)] px-2.5 py-1 text-[11px] text-white`}>
              {urgent ? <span aria-hidden="true" className="nx-pulse h-2 w-2 rounded-full bg-[var(--nx-coral)]" /> : <Icon name="clock" className="h-3 w-3" />}
              {left != null ? leftText(left) : c.validTill}
            </span>
          </div>
          <p className="nx-bold mt-5 text-[40px] uppercase leading-[0.9] tracking-[-0.03em]">{c.value}</p>
          <p className="nx-bold mt-3 text-[14px] uppercase tracking-[0.03em]">{c.title}</p>
          <p className={`mt-1 ${SMALL} text-black/70`}>{c.description}</p>
        </div>
        <div className="relative">
          <span aria-hidden="true" className="absolute -left-3.5 -top-3.5 h-7 w-7 rounded-full bg-[var(--nx-black)]" />
          <span aria-hidden="true" className="absolute -right-3.5 -top-3.5 h-7 w-7 rounded-full bg-[var(--nx-black)]" />
          <div className="border-t-2 border-dashed border-black/20" />
        </div>
        <div className="p-4 pt-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="nx-bold truncate text-[16px] tracking-[0.12em]">{c.code}</p>
            <p className={`${SMALL} shrink-0 text-[var(--nx-gray)]`}>till {c.validTill}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => onUse(c)} className={`nx-bold flex-1 rounded-full bg-[var(--nx-black)] py-3 text-[12px] uppercase tracking-[0.12em] text-white active:bg-[var(--nx-gray)] ${focusRing}`}>
              Use in store
            </button>
            <button type="button" onClick={() => onCopy(c.code)} aria-label={`Copy code ${c.code}`} aria-live="polite" className={`nx-bold grid min-w-[52px] place-items-center rounded-full border-2 border-[var(--nx-black)] px-3 text-[11px] uppercase ${focusRing}`}>
              {copied ? "Done" : <Icon name="copy" className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function CouponsSection({ coupons, now, onUse }: { coupons: NextCoupon[]; now: number | null; onUse: (c: NextCoupon) => void }) {
  const { copied, copy } = useCopy();
  const [tab, setTab] = useState<TabKey | null>(null);

  const live = useMemo(
    () =>
      coupons
        .map((c) => ({ c, left: now == null ? null : daysLeft(c.expiresOn, now) }))
        .filter((x) => x.left == null || x.left >= 0)
        .sort((a, b) => a.c.expiresOn.localeCompare(b.c.expiresOn)),
    [coupons, now],
  );
  const pick = (k: TabKey) =>
    live.filter(({ c, left }) => (k === "all" ? true : k === "expiring" ? left != null && left <= 7 : k === "member" ? c.kind !== "offer" : !!c.isNew));
  const counts: Record<TabKey, number> = { expiring: pick("expiring").length, all: pick("all").length, member: pick("member").length, new: pick("new").length };
  const current: TabKey = tab ?? (counts.expiring > 0 ? "expiring" : "all");
  const list = pick(current);

  return (
    <div>
      <div role="tablist" aria-label="Coupon filters" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const on = t.key === current;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.key)}
              className={`nx-bold flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[13px] ${on ? "bg-[var(--nx-glow)] text-black" : "bg-white/10 text-white active:bg-white/20"} ${focusRing}`}
            >
              {t.key === "expiring" && <span aria-hidden="true" className={`h-2 w-2 rounded-full bg-[var(--nx-coral)] ${on ? "" : "nx-pulse"}`} />}
              {t.label}
              <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] ${on ? "bg-black text-white" : "bg-white/15 text-white"}`}>{counts[t.key]}</span>
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-[28px] border-2 border-dashed border-white/25 px-6 py-9 text-center text-white">
          <Icon name="ticket" className="h-9 w-9 text-[var(--nx-glow)]" />
          <p className="nx-bold mt-3 text-[16px] uppercase">Nothing here right now</p>
          <p className={`mt-1 ${SMALL} text-white/65`}>Check another tab, new offers land often.</p>
        </div>
      ) : (
        <ul key={current} className="nx-tab -mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {list.map(({ c, left }) => (
            <CouponCard key={c.code} c={c} left={left} copied={copied === c.code} onCopy={copy} onUse={onUse} />
          ))}
        </ul>
      )}
      {list.length > 1 && <p className={`mt-1 text-center ${SMALL} text-white/55`}>Swipe for more →</p>}
    </div>
  );
}

/* ------------------------------ 04 shop more, save more -------------------------- */
const LADDER_MIN = 1000;
const LADDER_MAX = 20000;

function SaveMore({ ladder, billed }: { ladder: NextLadder; billed: number }) {
  const steps = [...ladder.steps].sort((a, b) => a.spend - b.spend);
  const [spend, setSpend] = useState(() => Math.min(LADDER_MAX, Math.max(LADDER_MIN, Math.round(Math.max(8000, billed * 2) / 500) * 500)));
  const unlocked = [...steps].reverse().find((s) => spend >= s.spend) ?? null;
  const upcoming = steps.find((s) => spend < s.spend) ?? null;
  const saving = unlocked ? Math.round((spend * unlocked.percent) / 100) : 0;
  const fill = ((spend - LADDER_MIN) / (LADDER_MAX - LADDER_MIN)) * 100;
  const posOf = (v: number) => Math.min(100, Math.max(0, ((v - LADDER_MIN) / (LADDER_MAX - LADDER_MIN)) * 100));

  return (
    <div className="mt-6 space-y-4">
      <div className="nx-grain relative overflow-hidden rounded-[36px] bg-[var(--nx-black)] p-5 text-white">
        <span aria-hidden="true" className="nx-float pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[rgba(255,190,154,0.25)] blur-2xl" />
        <p className={`relative ${CAPS} text-white/60`}>If your next bill is</p>
        <p className="nx-bold relative mt-1 text-[48px] leading-none tabular-nums tracking-[-0.03em]">₹{inr0(spend)}</p>

        <div className="relative mt-6 px-1">
          <input
            type="range"
            min={LADDER_MIN}
            max={LADDER_MAX}
            step={500}
            value={spend}
            onChange={(e) => setSpend(Number(e.target.value))}
            aria-label="Spend on a single bill"
            aria-valuetext={`₹${inr0(spend)}`}
            className="nx-range"
            style={{ background: `linear-gradient(90deg,var(--nx-glow) ${fill}%,rgba(255,255,255,.18) ${fill}%)` }}
          />
          <div aria-hidden="true" className="relative mt-3 h-9">
            {steps.map((s) => {
              const on = spend >= s.spend;
              return (
                <span key={s.spend} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${posOf(s.spend)}%` }}>
                  <span className={`mx-auto block h-2 w-0.5 ${on ? "bg-[var(--nx-glow)]" : "bg-white/30"}`} />
                  <span className={`nx-bold mt-1 block text-[12px] ${on ? "text-[var(--nx-glow)]" : "text-white/55"}`}>{s.percent}%</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="relative mt-3 rounded-[28px] bg-white p-4 text-[var(--nx-black)]" aria-live="polite">
          {unlocked ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`${CAPS} text-[var(--nx-gray)]`}>You unlock</p>
                  <p className="nx-bold mt-1 text-[22px] uppercase leading-none">{unlocked.title}</p>
                </div>
                <span className="nx-bold rounded-full bg-[var(--nx-glow)] px-3 py-1.5 text-[18px] leading-none">{unlocked.percent}% off</span>
              </div>
              <p className="nx-bold mt-4 text-[28px] leading-none tabular-nums">
                You save ₹{inr0(saving)}
              </p>
              <p className={`mt-2 ${BODY} text-[var(--nx-gray)]`}>{unlocked.perk}</p>
            </>
          ) : (
            <>
              <p className={`${CAPS} text-[var(--nx-gray)]`}>Not unlocked yet</p>
              <p className="nx-bold mt-1 text-[20px] uppercase leading-tight">Cross ₹{steps[0] ? inr0(steps[0].spend) : 0} to start saving</p>
            </>
          )}
          {upcoming && (
            <p className={`mt-3 flex items-center gap-2 rounded-2xl bg-[var(--nx-paper)] px-3 py-2.5 ${SMALL}`}>
              <Icon name="trend" className="h-4 w-4 shrink-0" />
              <span>
                Add <span className="nx-bold">₹{inr0(upcoming.spend - spend)}</span> more to unlock <span className="nx-bold">{upcoming.percent}% off</span>
              </span>
            </p>
          )}
        </div>
      </div>

      <p className={`px-2 text-center ${SMALL} text-[var(--nx-gray)]`}>
        Applies to a single bill at any NEXT store till {ladder.validTill}. Show your mobile number at billing and the associate will apply it.
      </p>
    </div>
  );
}

/* ------------------------------ refer a friend ----------------------------------- */
function ReferSection({ referral, onShare }: { referral: NextReferral; onShare: (code: string) => void }) {
  const { copied, copy } = useCopy();
  // SAMPLE link. Replace with the real join link from the NEXT loyalty API (`referral.link`).
  const link = referral.link ?? `https://nxt.link/${referral.code}`;
  const pts = inr0(referral.rewardPoints);

  const share = async () => {
    const text = `Join NEXT with my link and we both get ${pts} points on your first purchase.`;
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) await navigator.share({ title: "NEXT", text, url: link });
      else await copy(link);
      onShare(referral.code);
    } catch {
      /* share sheet dismissed */
    }
  };

  return (
    <div className="nx-grain relative mt-6 overflow-hidden rounded-[36px] bg-[var(--nx-black)] p-5 text-white">
      <span aria-hidden="true" className="nx-float pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[rgba(201,184,255,0.35)] blur-2xl" />
      <div className="relative flex items-center gap-3.5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--nx-glow)] text-black">
          <Icon name="users" className="h-6 w-6" />
        </span>
        <p className={`${BODY} text-white/80`}>
          Your friend joins and shops. You both get <span className="nx-bold text-[var(--nx-glow)]">{pts} points</span>.
        </p>
      </div>

      <button
        type="button"
        onClick={() => copy(link)}
        aria-label={`Copy referral link ${link}`}
        className={`relative mt-5 flex w-full items-center justify-between gap-3 rounded-full border border-white/25 bg-white/[0.07] py-2 pl-5 pr-2 text-left ${focusRing}`}
      >
        <span className="nx-bold truncate text-[15px] tracking-[0.02em]">{link.replace(/^https?:\/\//, "")}</span>
        <span aria-live="polite" className="nx-bold flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2.5 text-[11px] uppercase tracking-[0.1em] text-black">
          {copied === link ? (<><Icon name="check" className="h-3.5 w-3.5" />Copied</>) : (<><Icon name="copy" className="h-3.5 w-3.5" />Copy</>)}
        </span>
      </button>

      <button type="button" onClick={share} className={`${glowBtn} relative mt-3`}>
        <Icon name="share" className="h-4 w-4" />
        Share with a friend
      </button>
    </div>
  );
}

/* ------------------------------ gift a NEXT card --------------------------------- */
const GIFT_AMOUNTS = [500, 1000, 2000, 5000];

function GiftSection({ data, onRequest }: { data: NextReceiptData; onRequest?: (v: GiftCardValues) => void }) {
  const [amount, setAmount] = useState(1000);
  const [custom, setCustom] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState<GiftCardValues | null>(null);
  const otherId = useId();

  const finalAmount = custom ? Number(custom) : amount;
  const valid = Number.isFinite(finalAmount) && finalAmount >= 500 && finalAmount <= 25000;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setOtherOpen(true);
      setErr("Pick an amount between ₹500 and ₹25,000.");
      return;
    }
    setErr("");
    const values: GiftCardValues = { invoiceNo: data.invoiceNo, amount: finalAmount, fromName: data.customer.name };
    onRequest?.(values);
    setSent(values);
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="nx-sheen nx-grain relative aspect-[1.9] w-full rounded-[32px] p-5 text-white shadow-[0_28px_44px_-22px_rgba(11,11,12,0.7)]" style={{ background: "linear-gradient(135deg,#0B0B0C 0%,#2B2442 100%)" }}>
        <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border-[18px] border-[var(--nx-lilac)] opacity-30" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-14 h-32 w-32 rounded-full border-[10px] border-[var(--nx-glow)] opacity-25" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="nx-bold text-[22px] uppercase tracking-[0.34em]">NEXT</span>
            <span className={`nx-bold rounded-full bg-white/15 px-3 py-1 ${CAPS} text-[10px]`}>Gift card</span>
          </div>
          <p className="nx-bold text-[46px] leading-none tabular-nums tracking-[-0.03em] text-[var(--nx-glow)]">₹{valid ? inr0(finalAmount) : "0"}</p>
        </div>
      </div>

      {sent ? (
        <div className="rounded-[32px] bg-white p-5" aria-live="polite">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--nx-mint)] text-black">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <p className="nx-bold mt-4 text-[22px] uppercase leading-tight text-[var(--nx-black)]">₹{inr0(sent.amount)} gift card</p>
          <p className={`mt-2 ${BODY}`}>
            Show this screen to <span className="nx-bold text-[var(--nx-black)]">{data.store.associate}</span> at the billing counter. Pay ₹{inr0(sent.amount)} and they will issue the card on the spot.
          </p>
          <button type="button" onClick={() => setSent(null)} className={`nx-bold mt-4 underline underline-offset-4 ${SMALL} text-[var(--nx-black)]`}>
            Change amount
          </button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="rounded-[32px] bg-white p-4">
          <div role="group" aria-label="Gift card amount" className="grid grid-cols-4 gap-2">
            {GIFT_AMOUNTS.map((a) => {
              const on = !custom && amount === a;
              return (
                <button key={a} type="button" aria-pressed={on} onClick={() => { setCustom(""); setErr(""); setAmount(a); }} className={`nx-bold rounded-full py-3.5 text-[14px] tabular-nums ${on ? "bg-[var(--nx-black)] text-white" : "bg-[var(--nx-paper)] text-[var(--nx-black)]"} ${focusRing}`}>
                  ₹{inr0(a)}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={() => setOtherOpen((o) => !o)} aria-expanded={otherOpen} aria-controls={otherId} className={`mt-2.5 flex w-full items-center justify-between gap-2 rounded-full bg-[var(--nx-paper)] py-2 pl-5 pr-2 text-left ${focusRing}`}>
            <span className={`${LABEL} text-[var(--nx-black)]`}>{custom ? `Other amount: ₹${inr0(Number(custom))}` : "Other amount"}</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--nx-black)] text-white">
              <Icon name="chevron" className={`h-4 w-4 transition-transform duration-300 ${otherOpen ? "rotate-180" : ""}`} />
            </span>
          </button>
          <Collapse open={otherOpen} id={otherId}>
            <div className="p-1 pt-3">
              <input inputMode="numeric" value={custom} onChange={(e) => { setErr(""); setCustom(e.target.value.replace(/\D/g, "").slice(0, 5)); }} placeholder="₹500 to ₹25,000" aria-label="Custom amount" className={fieldInput} />
            </div>
          </Collapse>

          {err && <p role="alert" className="nx-bold mt-3 rounded-2xl bg-[rgba(255,91,58,0.15)] px-4 py-3 text-[13px] text-[var(--nx-black)]">{err}</p>}
          <button type="submit" className={`${solidBtn} mt-3`}>
            <Icon name="gift" className="h-4 w-4" />
            Gift ₹{valid ? inr0(finalAmount) : "0"}
          </button>
          <p className={`mt-3 text-center ${SMALL}`}>Pay at the billing counter. The associate issues the card on the spot.</p>
        </form>
      )}
    </div>
  );
}

/* ------------------------------ video -------------------------------------------- */
function VideoBlock() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const near = useInView(sectionRef, "300px 0px", 0);
  const visible = useInView(sectionRef, "0px", 0.5);

  useEffect(() => {
    if (near) setMounted(true);
  }, [near]);

  const command = useCallback((func: string) => {
    frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: "" }), "*");
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const func = visible ? "playVideo" : "pauseVideo";
    const timers = [0, 600, 1500].map((ms) => window.setTimeout(() => command(func), ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [loaded, visible, command]);

  const src = mounted
    ? `https://www.youtube-nocookie.com/embed/${MARKETING_VIDEO_ID}?enablejsapi=1&mute=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${MARKETING_VIDEO_ID}&origin=${encodeURIComponent(window.location.origin)}`
    : "";

  return (
    <section ref={sectionRef} aria-label="NEXT video" className="overflow-hidden rounded-[36px] bg-[var(--nx-black)] p-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-[30px] bg-[var(--nx-black)] bg-cover bg-center" style={{ backgroundImage: `url(https://i.ytimg.com/vi/${MARKETING_VIDEO_ID}/hqdefault.jpg)` }}>
        {mounted && (
          <iframe ref={frameRef} src={src} title="NEXT video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" onLoad={() => setLoaded(true)} className="absolute inset-0 h-full w-full border-0" />
        )}
      </div>
      <div className={`flex items-center justify-between px-4 py-3 ${CAPS} text-white`}>
        <span className="nx-bold">Inside NEXT</span>
        <span className="text-white/55">Plays on mute</span>
      </div>
    </section>
  );
}

/* ------------------------------ 07 rate ------------------------------------------ */
const RATING_WORDS = ["Poor", "Fair", "Good", "Very good", "Excellent"];
const FEEDBACK_CATEGORIES = [
  { key: "service", label: "Service quality" },
  { key: "product", label: "Product offering" },
  { key: "sizes", label: "Sizes availability" },
  { key: "value", label: "Value for money" },
] as const;

function FeedbackCard({ data, onSubmit }: { data: NextReceiptData; onSubmit?: (v: FeedbackValues) => void }) {
  const [overall, setOverall] = useState(0);
  const [hover, setHover] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [cats, setCats] = useState({ service: 0, product: 0, sizes: 0, value: 0 });
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const commentId = useId();
  const detailId = useId();
  const shown = hover || overall;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.({ invoiceNo: data.invoiceNo, overall, categories: cats, comment: comment.trim() });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex items-start gap-3.5 rounded-[28px] bg-[var(--nx-black)] p-5 text-white" aria-live="polite">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--nx-glow)] text-black">
          <Icon name="check" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="nx-bold text-[18px] uppercase">Thanks for rating</p>
          <p className={`mt-1 ${SMALL} text-white/70`}>
            You gave {overall} {overall === 1 ? "star" : "stars"} ({RATING_WORDS[overall - 1].toLowerCase()}).
          </p>
          <button type="button" onClick={() => { setSubmitted(false); setExpanded(false); setOverall(0); }} className={`nx-bold mt-2 underline underline-offset-4 ${SMALL}`}>
            Edit rating
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Overall rating" className="flex justify-between gap-1.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= shown;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={overall === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}, ${RATING_WORDS[n - 1]}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => { setOverall(n); setExpanded(true); }}
              className={`grid h-[60px] flex-1 place-items-center rounded-full ${on ? "bg-[var(--nx-black)]" : "bg-[var(--nx-paper)]"} ${focusRing}`}
            >
              <svg viewBox="0 0 24 24" strokeWidth="1.5" strokeLinejoin="round" className={`h-7 w-7 ${on ? "fill-[var(--nx-glow)] stroke-[var(--nx-glow)]" : "fill-transparent stroke-[var(--nx-black)]"} ${!overall && !hover ? "nx-star-flash" : ""}`} style={!overall && !hover ? { animationDelay: `${(n - 1) * 0.18}s` } : undefined}>
                <path d={STAR_PATH} />
              </svg>
            </button>
          );
        })}
      </div>
      <p className={`nx-bold mt-3 text-center ${CAPS} text-[var(--nx-black)]`}>{overall ? `${RATING_WORDS[overall - 1]}, ${overall} of 5` : "Tap a star"}</p>

      <Collapse open={expanded} id={detailId}>
        <form onSubmit={submit} noValidate className="space-y-4 pt-5">
          <div className="space-y-2">
            {FEEDBACK_CATEGORIES.map((c) => (
              <div key={c.key} className="flex items-center justify-between rounded-full bg-[var(--nx-paper)] py-1 pl-4 pr-2">
                <span className={`${SMALL} text-[var(--nx-black)]`}>{c.label}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setCats((p) => ({ ...p, [c.key]: star }))} className="p-1.5" aria-label={`${star} stars for ${c.label}`}>
                      <svg viewBox="0 0 24 24" strokeWidth="1.5" className={`h-[18px] w-[18px] stroke-[var(--nx-black)] ${star <= cats[c.key] ? "fill-[var(--nx-black)]" : "fill-transparent"}`}>
                        <path d={STAR_PATH} />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div>
            <label htmlFor={commentId} className={fieldLabel}>Anything else? (optional)</label>
            <textarea id={commentId} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us what you liked or how we can improve" className={`${fieldInput} resize-none`} />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className={`${solidBtn} flex-1`}>Send rating</button>
            <button type="button" onClick={() => setExpanded(false)} className={ghostBtn}>Cancel</button>
          </div>
        </form>
      </Collapse>
    </div>
  );
}

/* ------------------------------- 08 profile -------------------------------------- */
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

function Toggle({ checked, onChange, disabled = false, label }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange?.(!checked)} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? "bg-[var(--nx-black)]" : "bg-black/15"} ${disabled ? "opacity-60" : ""} ${focusRing}`}>
      <span aria-hidden="true" className={`absolute top-1 h-6 w-6 rounded-full transition-all ${checked ? "left-7 bg-[var(--nx-glow)]" : "left-1 bg-white"}`} />
    </button>
  );
}

function ProfileCard({ data, onSave }: { data: NextReceiptData; onSave?: (v: ProfileValues) => void }) {
  const [form, setForm] = useState<ProfileValues>({ name: data.customer.name, email: data.customer.email, gender: "", birthday: "", anniversary: "", offers: false });
  const [saved, setSaved] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [open, setOpen] = useState(true);
  const panelId = useId();
  const upd = <K extends keyof ProfileValues>(k: K, v: ProfileValues[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form.email && !emailOk(form.email)) {
      setEmailErr("Enter a valid email address, like name@example.com.");
      return;
    }
    setEmailErr("");
    onSave?.(form);
    setSaved(true);
  };

  return (
    <div className={`${card} mt-6 overflow-hidden`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId} className={`flex w-full items-center justify-between gap-4 p-5 text-left ${focusRing}`}>
        <span>
          <span className="nx-bold block text-[18px] uppercase leading-tight text-[var(--nx-black)]">Your details</span>
          <span className={`mt-0.5 block ${SMALL}`}>{saved ? "Saved. Thank you!" : "Takes about 30 seconds"}</span>
        </span>
        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--nx-black)] text-white">
          <Icon name="chevron" className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <Collapse open={open} id={panelId}>
    <form onSubmit={submit} noValidate className="space-y-4 px-5 pb-5">
      <div>
        <span className={fieldLabel}>Mobile number</span>
        <p className={`${fieldInput} nx-bold tabular-nums`}>{data.customer.mobile}</p>
      </div>
      <label className="block">
        <span className={fieldLabel}>Full name</span>
        <input className={fieldInput} value={form.name} onChange={(e) => upd("name", e.target.value)} autoComplete="name" />
      </label>
      <label className="block">
        <span className={fieldLabel}>Email address</span>
        <input type="email" className={fieldInput} value={form.email} onChange={(e) => { setEmailErr(""); upd("email", e.target.value); }} autoComplete="email" aria-invalid={!!emailErr} />
        {emailErr && <span role="alert" className="nx-bold mt-1.5 block text-[13px] text-[var(--nx-coral)]">{emailErr}</span>}
      </label>
      <fieldset>
        <legend className={fieldLabel}>Gender</legend>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => {
            const on = form.gender === g;
            return (
              <button key={g} type="button" aria-pressed={on} onClick={() => upd("gender", on ? "" : g)} className={`rounded-full px-4 py-2.5 text-[14px] ${on ? "nx-bold bg-[var(--nx-black)] text-white" : "bg-[var(--nx-paper)] text-[var(--nx-gray)]"} ${focusRing}`}>
                {g}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <label className="block min-w-0">
          <span className={fieldLabel}>Birthday</span>
          <input type="date" className={fieldInput} value={form.birthday} onChange={(e) => upd("birthday", e.target.value)} autoComplete="bday" />
          <span className={`mt-1 block ${SMALL}`}>For birthday offers</span>
        </label>
        <label className="block min-w-0">
          <span className={fieldLabel}>Anniversary</span>
          <input type="date" className={fieldInput} value={form.anniversary} onChange={(e) => upd("anniversary", e.target.value)} />
          <span className={`mt-1 block ${SMALL}`}>Optional</span>
        </label>
      </div>
      <fieldset>
        <legend className={fieldLabel}>Communication preferences</legend>
        <ul className="space-y-2">
          <li className="flex items-center justify-between gap-4 rounded-3xl bg-[var(--nx-paper)] p-4">
            <div>
              <p className={`${LABEL} text-[var(--nx-black)]`}>Purchase and order updates</p>
              <p className={`mt-0.5 ${SMALL}`}>Receipts and return confirmations. Always on.</p>
            </div>
            <Toggle checked disabled label="Purchase and order updates, always on" />
          </li>
          <li className="flex items-center justify-between gap-4 rounded-3xl bg-[var(--nx-paper)] p-4">
            <div>
              <p className={`${LABEL} text-[var(--nx-black)]`}>New arrivals and offers</p>
              <p className={`mt-0.5 ${SMALL}`}>Collections, member offers and seasonal edits.</p>
            </div>
            <Toggle checked={form.offers} onChange={(v) => upd("offers", v)} label="New arrivals and offers" />
          </li>
        </ul>
      </fieldset>
      <div>
        <button type="submit" className={solidBtn}>
          {saved ? (<><Icon name="check" className="h-4 w-4" /> Details saved</>) : "Save details"}
        </button>
        <p className={`mt-3 text-center ${SMALL}`}>Your information is used only for purchase communication and personalisation. We never share your data with third parties.</p>
        <span className="sr-only" aria-live="polite">{saved ? "Details saved" : ""}</span>
      </div>
    </form>
      </Collapse>
    </div>
  );
}

/* ------------------------------ receipt view ------------------------------------- */
interface ReceiptViewProps extends Omit<NextReceiptProps, "data" | "receipts" | "onSelectReceipt"> {
  data: NextReceiptData;
  history: HistoryRow[];
  onSelect: (invoiceNo: string) => void;
}

interface NavGroup {
  id: string;
  label: string;
  icon: IconName;
  items: { id: string; label: string }[];
}

function ReceiptView({
  data, history, onSelect, qrSrc,
  logoSrc = DEFAULT_NEXT_LOGO,
  rdepLogoSrc = DEFAULT_RDEP_LOGO,
  instagramUrl = DEFAULT_INSTAGRAM_URL,
  storeLocatorUrl = DEFAULT_STORE_LOCATOR_URL,
  onDownload, onSendEmail, onSaveProfile, onSubmitFeedback, onRequestGiftCard, onShareReferral,
}: ReceiptViewProps) {
  const [openItem, setOpenItem] = useState(-1);
  const [modal, setModal] = useState<ModalId>(null);
  const [couponSheet, setCouponSheet] = useState<NextCoupon | null>(null);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [active, setActive] = useState("receipt");
  const [progress, setProgress] = useState(0);
  const closeModal = useCallback(() => setModal(null), []);
  const exchangeId = useId();
  const contactId = useId();
  const scale = useFitScale();
  const now = useNow();

  const { store, exchange, club } = data;
  const referral: NextReferral = data.referral ?? { code: `${data.customer.name.trim().split(/\s+/)[0].toUpperCase()}-NXT500`, rewardPoints: 500 };
  const ladder = data.ladder ?? SAMPLE_LADDER;
  const t = useMemo(() => totalsOf(data), [data]);
  const firstName = data.customer.name.trim().split(/\s+/)[0] || data.customer.name;
  const nameSize = Math.min(64, Math.max(28, Math.floor(300 / (0.66 * firstName.length))));
  const tier = club ? TIERS.find((x) => x.name === club.tier) ?? TIERS[0] : null;
  const earned = club?.pointsEarned ?? Math.floor(t.total / 10);
  const handleDownload = () => (onDownload ? onDownload(data) : downloadReceipt(data, logoSrc, rdepLogoSrc));
  const { copied: couponCopied, copy: copyCode } = useCopy();

  const groups = useMemo<NavGroup[]>(
    () => [
      { id: "receipt", label: "Receipt", icon: "bag", items: [{ id: "receipt", label: "Bill" }, { id: "rate", label: "Rate" }, { id: "profile", label: "Profile" }] },
      ...(club ? [{ id: "rewards", label: "Rewards", icon: "star" as IconName, items: [{ id: "points", label: "Points" }, { id: "coupons", label: "Coupons" }] }] : []),
      { id: "offers", label: "Offers", icon: "gift", items: [{ id: "save", label: "Save more" }, { id: "refer", label: "Refer" }, { id: "gift", label: "Gift card" }] },
      { id: "store", label: "Store", icon: "pin", items: [{ id: "store", label: "Store" }] },
    ],
    [club],
  );
  const nav = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const activeGroupIdx = Math.max(0, groups.findIndex((g) => g.items.some((i) => i.id === active)));
  const activeGroup = groups[activeGroupIdx];

  /* scroll-spy: the chapter crossing the upper third of the screen is the active one */
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = nav.map((n) => document.getElementById(`nx-${n.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id.replace("nx-", ""))),
      { rootMargin: "-22% 0px -68% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [nav]);

  /* page progress line */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const go = (id: string) => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
    } catch {
      /* haptics unavailable */
    }
    jumpTo(id);
  };

  const shortcuts: { id: string; label: string; icon: IconName; bg: string; badge?: string }[] = [
    ...(club ? [{ id: "coupons", label: "Coupons", icon: "ticket" as IconName, bg: "bg-[var(--nx-glow)]", badge: String(club.coupons.length) }] : []),
    { id: "save", label: "Save more", icon: "trend", bg: "bg-[var(--nx-lilac)]" },
    { id: "refer", label: "Refer", icon: "users", bg: "bg-white" },
    { id: "gift", label: "Gift", icon: "gift", bg: "bg-[var(--nx-mint)]" },
  ];

  return (
    <div
      style={theme}
      onTouchStart={() => {}}
      className={`nx-root ${fallbackFont.variable} min-h-screen overflow-x-clip bg-[#DAD6CE] text-[var(--nx-gray)] antialiased [-webkit-text-size-adjust:100%] sm:py-8`}
    >
      <style>{FONT_FACES}</style>

      <main style={zoomStyle(scale)} className="mx-auto w-[400px] overflow-x-clip bg-[var(--nx-paper)] sm:shadow-[0_30px_70px_-28px_rgba(11,11,12,0.6)]">
        {/* =============================== HERO =============================== */}
        <header className="nx-grain relative overflow-hidden rounded-b-[44px] bg-[var(--nx-black)] px-5 pb-6 pt-5 text-white">
          <span aria-hidden="true" className="nx-float pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #FFE6D6 0%, #FFBE9A 40%, rgba(255,190,154,0) 70%)", opacity: 0.85 }} />
          <span aria-hidden="true" className="nx-float pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full" style={{ background: "radial-gradient(circle at 60% 40%, #C9B8FF 0%, rgba(201,184,255,0) 68%)", opacity: 0.7, animationDelay: "-4s" }} />

          <div className="nx-rise relative flex items-center justify-between gap-4">
            <BrandImage src={logoSrc} alt="NEXT" width={320} height={80} priority className="h-6 w-auto max-w-[46%] shrink-0 object-contain object-left brightness-0 invert" fallbackClassName="nx-bold inline-block text-[24px] uppercase leading-none tracking-[0.34em] text-white" />
            {club && tier && (
              <button type="button" onClick={() => jumpTo("points")} aria-label={`${club.tier} member. View points`} className="nx-bold inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] uppercase tracking-[0.14em] text-[var(--nx-black)]" style={{ background: tier.foil }}>
                <Icon name="star" className="h-3.5 w-3.5" />
                {club.tier}
              </button>
            )}
          </div>

          <div className="nx-rise relative mt-9 flex items-end justify-between gap-3" style={{ animationDelay: "0.1s" }}>
            <div className="min-w-0">
              <p className={`${CAPS} text-white/70`}>Thank you,</p>
              <h1 className="nx-bold mt-1 uppercase leading-[0.95] tracking-[-0.03em] [overflow-wrap:anywhere]" style={{ fontSize: nameSize }}>
                {firstName}
              </h1>
            </div>
            <button type="button" onClick={() => jumpTo(club ? "points" : "receipt")} aria-label={`You earned ${earned} points`} className="relative h-[92px] w-[92px] shrink-0 text-[var(--nx-glow)]">
              <SpinRing text="POINTS EARNED TODAY • POINTS EARNED TODAY • " className="nx-spin absolute inset-0 h-full w-full" />
              <span className="absolute inset-[17px] grid place-items-center rounded-full bg-[var(--nx-glow)] text-black">
                <span className="nx-bold text-[18px] leading-none tabular-nums">+{inr0(earned)}</span>
              </span>
            </button>
          </div>

          <div className="nx-rise relative mt-6 flex items-center justify-between gap-3 rounded-[30px] bg-white/[0.09] p-4 backdrop-blur-sm" style={{ animationDelay: "0.2s" }}>
            <div className="min-w-0">
              <p className={`${CAPS} text-white/65`}>You paid</p>
              <p className="nx-bold mt-1 text-[44px] leading-none tabular-nums tracking-[-0.03em] text-[var(--nx-glow)]">₹{inr(t.total)}</p>
              {t.discount > 0 && <p className={`nx-bold mt-2 inline-block rounded-full bg-white/15 px-2.5 py-1 ${SMALL}`}>Saved ₹{inr(t.discount)}</p>}
            </div>
            <button type="button" onClick={() => setModal("qr")} aria-label="View QR code" className="h-[76px] w-[76px] shrink-0 -rotate-3 rounded-[22px] bg-white p-2 text-[var(--nx-black)] shadow-[0_14px_26px_-10px_rgba(0,0,0,0.7)]">
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrSrc} alt="Receipt QR code" className="h-full w-full object-contain" />
              ) : (
                <PlaceholderQR seed={data.invoiceNo} />
              )}
            </button>
          </div>

          <div className="nx-rise relative mt-5" style={{ animationDelay: "0.3s" }}>
            <p className={`${CAPS} mb-2.5 text-white/60`}>Unlocked for you today</p>
            <div className="grid auto-cols-fr grid-flow-col gap-2">
              {shortcuts.map((s) => (
                <button key={s.id} type="button" onClick={() => jumpTo(s.id)} className={`relative flex flex-col items-center gap-2 rounded-[24px] px-1 pb-3 pt-3.5 text-black ${s.bg}`}>
                  {s.badge && <span className="nx-bold absolute right-2 top-2 grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[10px] text-white">{s.badge}</span>}
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-black/10">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <span className="nx-bold text-[11px] uppercase leading-none tracking-[0.04em]">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="space-y-10 px-4 pb-10 pt-6">
          {/* ===================== RECEIPT ===================== */}
          <section id="nx-receipt" aria-label="Your receipt" className="scroll-mt-5 nx-reveal">
            <ChapterHead label="Receipt" title={<>Your<br />bag.</>} sub={`Invoice ${data.invoiceNo} · ${data.date}`} />
            <div className={`${card} mt-5 p-5`}>
              <div className="flex items-center justify-between gap-3">
                <p className={`${CAPS} text-[var(--nx-gray)]`}>{store.name}</p>
                <span className="nx-bold rounded-full bg-[var(--nx-paper)] px-3 py-1.5 text-[12px] text-[var(--nx-black)]">
                  {t.pieces} {t.pieces === 1 ? "item" : "items"}
                </span>
              </div>
              <ul aria-label="Items purchased" className="mt-2">
                {data.items.map((item, i) => (
                  <ItemRow key={`${item.sku}-${i}`} item={item} open={openItem === i} onToggle={() => setOpenItem(openItem === i ? -1 : i)} />
                ))}
              </ul>

              <dl className="mt-1 space-y-2.5 border-t border-dashed border-black/15 py-4">
                {([
                  ["Subtotal (MRP)", `₹${inr(t.subtotal)}`],
                  ["Discount", `− ₹${inr(t.discount)}`],
                  ["SGST", `₹${inr(data.sgst)}`],
                  ["CGST", `₹${inr(data.cgst)}`],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dt className={`${SMALL} text-[var(--nx-gray)]`}>{k}</dt>
                    <dd className={`${AMOUNT} text-[var(--nx-black)]`}>{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="nx-grain relative overflow-hidden rounded-[28px] bg-[var(--nx-black)] p-5 text-white">
                <span aria-hidden="true" className="nx-float pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[rgba(255,190,154,0.25)] blur-xl" />
                <p className={`relative ${CAPS} text-white/65`}>Total paid</p>
                <p className="nx-bold relative mt-1 text-[46px] leading-none tabular-nums tracking-[-0.03em] text-[var(--nx-glow)]">₹{inr(t.total)}</p>
                <div className="relative mt-5 flex items-end justify-between gap-4 border-t border-dashed border-white/30 pt-4">
                  <div className="min-w-0">
                    <p className={`${CAPS} text-white/65`}>Payment method</p>
                    <p className={`${LABEL} mt-1`}>{data.payment.mode} &ndash; {data.payment.ref}</p>
                  </div>
                  <Barcode seed={data.invoiceNo} className="h-9 w-[104px] shrink-0 text-white" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {([
                  { icon: "history", label: "History", onClick: () => setModal("history") },
                  { icon: "mail", label: "Email", onClick: () => setModal("email") },
                  { icon: "download", label: "Download", onClick: handleDownload },
                ] as { icon: IconName; label: string; onClick: () => void }[]).map((a) => (
                  <button key={a.label} type="button" onClick={a.onClick} className={`nx-bold flex flex-col items-center gap-1.5 rounded-[22px] bg-[var(--nx-paper)] py-3.5 text-[11px] uppercase tracking-[0.1em] text-[var(--nx-black)] active:bg-[var(--nx-glow)] ${focusRing}`}>
                    <Icon name={a.icon} className="h-5 w-5" />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ===================== RATE ===================== */}
          <section id="nx-rate" aria-label="Rate your visit" className="scroll-mt-5 nx-reveal">
            <ChapterHead label="Rate" title={<>How was<br />your visit?</>} sub={`Tell us about your experience at ${store.name.split(" ")[0]}.`} />
            <div className={`${card} mt-5 p-5`}>
              <FeedbackCard data={data} onSubmit={onSubmitFeedback} />
            </div>
          </section>

          <VideoBlock />

          {/* ===================== PROFILE ===================== */}
          <section id="nx-profile" aria-label="Your profile" className="scroll-mt-5 nx-reveal">
            <ChapterHead label="Profile" title={<>Make it<br />yours.</>} sub="Complete your profile for personalised updates and loyalty benefits." />
            <ProfileCard data={data} onSave={onSaveProfile} />
          </section>

          {/* ===================== POINTS ===================== */}
          {club && (
            <section id="nx-points" aria-label="NEXT Club points" className="scroll-mt-5 nx-reveal">
              <ChapterHead label="Points" title={<>Your<br />rewards.</>} sub="Points land on your mobile number automatically. Ask the associate to redeem them at billing." />
              <div className="mt-5">
                <ClubCard club={club} mobile={data.customer.mobile} earned={earned} logoSrc={logoSrc} />
              </div>
            </section>
          )}

          {/* ===================== COUPONS ===================== */}
          {club && (
            <section id="nx-coupons" aria-label="Coupons" className="nx-grain relative -mx-4 scroll-mt-5 nx-reveal overflow-hidden rounded-[44px] bg-[var(--nx-black)] px-5 pb-8 pt-8">
              <span aria-hidden="true" className="nx-float pointer-events-none absolute -right-16 top-10 h-48 w-48 rounded-full bg-[rgba(201,184,255,0.25)] blur-2xl" />
              <div className="relative">
                <ChapterHead dark label="Coupons" title={<>Use them<br /><span className="text-[var(--nx-glow)]">before</span><br />they go.</>} sub="Show any code at the billing counter. Nothing to type, nothing to scan." />
                <div className="mt-6">
                  <CouponsSection coupons={club.coupons} now={now} onUse={(c) => { setCouponSheet(c); setModal("coupon"); }} />
                </div>
              </div>
            </section>
          )}

          {/* ===================== SHOP MORE, SAVE MORE ===================== */}
          <section id="nx-save" aria-label="Shop more, save more" className="scroll-mt-5 nx-reveal">
            <ChapterHead label="Save more" title={<>Shop more.<br />Save more.</>} sub="The bigger your next bill, the bigger the reward. Slide to see what you would unlock." />
            <SaveMore ladder={ladder} billed={t.total} />
          </section>

          {/* ===================== REFER ===================== */}
          <section id="nx-refer" aria-label="Refer a friend" className="-mx-4 scroll-mt-5 nx-reveal rounded-[44px] bg-[var(--nx-peach-soft)] px-4 pb-6 pt-8">
            <div className="px-1">
              <ChapterHead label="Refer" title={<>Give {inr0(referral.rewardPoints)}.<br />Get {inr0(referral.rewardPoints)}.</>} sub="Send your link. When your friend makes their first purchase in store, you both get points." />
            </div>
            <ReferSection referral={referral} onShare={(c) => onShareReferral?.(c)} />
          </section>

          {/* ===================== GIFT ===================== */}
          <section id="nx-gift" aria-label="Gift a NEXT card" className="-mx-4 scroll-mt-5 nx-reveal rounded-[44px] bg-[var(--nx-lilac-soft)] px-4 pb-6 pt-8">
            <div className="px-1">
              <ChapterHead label="Gift card" title={<>Gift a<br />NEXT card.</>} sub="Pick an amount and pay at the counter. The associate hands you the card." />
            </div>
            <GiftSection data={data} onRequest={onRequestGiftCard} />
          </section>

          {/* ===================== STORE ===================== */}
          <section id="nx-store" aria-label="Store and help" className="scroll-mt-5 nx-reveal">
            <ChapterHead label="Store" title={<>Need us?<br />We are here.</>} />

            <div className={`${card} mt-5 p-5 text-[var(--nx-black)]`}>
              <p className={`${CAPS} text-[var(--nx-gray)]`}>You shopped at</p>
              <p className="nx-bold mt-1 text-[22px] uppercase leading-tight tracking-[-0.01em]">{store.name}</p>
              <p className={`mt-2 flex items-start gap-2.5 ${BODY} text-[var(--nx-gray)]`}>
                <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-black)]" />
                {store.address}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name}, ${store.address}`)}`} target="_blank" rel="noopener noreferrer" className={`${solidBtn} !py-3.5`}>
                  <Icon name="directions" className="h-4 w-4" />
                  Directions
                </a>
                <a href={`tel:${store.phone}`} className={`${ghostBtn} !py-3.5`}>
                  <Icon name="call" className="h-4 w-4" />
                  Call store
                </a>
              </div>

              <button type="button" onClick={() => setContactOpen((o) => !o)} aria-expanded={contactOpen} aria-controls={contactId} className={`mt-4 flex w-full items-center justify-between gap-2 rounded-full bg-[var(--nx-paper)] py-2.5 pl-5 pr-2.5 text-left ${focusRing}`}>
                <span className={LABEL}>{contactOpen ? "Hide contact and tax info" : "Contact and tax info"}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--nx-black)] text-white">
                  <Icon name="chevron" className={`h-4 w-4 transition-transform duration-300 ${contactOpen ? "rotate-180" : ""}`} />
                </span>
              </button>
              <Collapse open={contactOpen} id={contactId}>
                <div className="mt-3 space-y-2">
                  <a href={`mailto:${store.email}`} className="flex items-center gap-3 rounded-3xl bg-[var(--nx-paper)] p-3.5">
                    <Icon name="mail" className="h-4 w-4 shrink-0" />
                    <span className="min-w-0">
                      <span className={`block ${SMALL} text-[var(--nx-gray)]`}>Email support</span>
                      <span className={`${LABEL} block truncate`}>{store.email}</span>
                    </span>
                  </a>
                  <a href={`tel:${store.phone}`} className="flex items-center gap-3 rounded-3xl bg-[var(--nx-paper)] p-3.5">
                    <Icon name="phone" className="h-4 w-4 shrink-0" />
                    <span className="min-w-0">
                      <span className={`block ${SMALL} text-[var(--nx-gray)]`}>Store phone</span>
                      <span className={`${LABEL} block truncate tabular-nums`}>{store.phone}</span>
                    </span>
                  </a>
                  <div className={`grid gap-2 ${store.gstin ? "grid-cols-2" : "grid-cols-1"}`}>
                    <div className="rounded-3xl bg-[var(--nx-paper)] p-3.5">
                      <p className={`flex items-center gap-1.5 ${SMALL} text-[var(--nx-gray)]`}><Icon name="user" className="h-3.5 w-3.5" /> Sales associate</p>
                      <p className={`${LABEL} mt-1`}>{store.associate}</p>
                    </div>
                    {store.gstin && (
                      <div className="min-w-0 rounded-3xl bg-[var(--nx-paper)] p-3.5">
                        <p className={`flex items-center gap-1.5 ${SMALL} text-[var(--nx-gray)]`}><Icon name="tax" className="h-3.5 w-3.5" /> GSTIN</p>
                        <p className={`${LABEL} mt-1 truncate tabular-nums`} title={store.gstin}>{store.gstin}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Collapse>
            </div>

            <div className={`${card} mt-4 overflow-hidden text-[var(--nx-black)]`}>
              <h3>
                <button type="button" onClick={() => setExchangeOpen((o) => !o)} aria-expanded={exchangeOpen} aria-controls={exchangeId} className={`flex w-full items-center justify-between gap-4 p-5 text-left ${focusRing}`}>
                  <span>
                    <span className="nx-bold block text-[20px] uppercase leading-tight tracking-[-0.01em]">Exchange policy</span>
                    <span className={`mt-1 block ${BODY} text-[var(--nx-gray)]`}>{exchange.days} days to change your mind</span>
                  </span>
                  <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--nx-black)] text-white">
                    <Icon name="chevron" className={`h-4 w-4 transition-transform duration-300 ${exchangeOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
              </h3>
              <Collapse open={exchangeOpen} id={exchangeId}>
                <ol className="space-y-2 px-5 pb-5">
                  {exchange.points.map((p, i) => (
                    <li key={p} className={`flex items-start gap-3 rounded-3xl bg-[var(--nx-paper)] p-4 ${BODY} text-[var(--nx-gray)]`}>
                      <span className="nx-bold grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--nx-black)] text-[12px] tabular-nums text-white">{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ol>
              </Collapse>
            </div>

            <div className={`${card} mt-4 p-5`}>
              <p className={`${CAPS} text-[var(--nx-gray)]`}>Get in touch</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([
                  { icon: "instagram", label: "Instagram", href: instagramUrl, ext: true },
                  { icon: "phone", label: "Call us", href: `tel:${data.callTo}`, ext: false },
                  { icon: "mail", label: "Email us", href: `mailto:${data.emailTo}`, ext: false },
                ] as { icon: IconName; label: string; href: string; ext: boolean }[]).map((l) => (
                  <a key={l.label} href={l.href} {...(l.ext ? { target: "_blank", rel: "noopener noreferrer" } : null)} className={`nx-bold flex flex-col items-center gap-2 rounded-[22px] bg-[var(--nx-paper)] py-4 text-center text-[11px] uppercase tracking-[0.1em] text-[var(--nx-black)] active:bg-[var(--nx-glow)] ${focusRing}`}>
                    <Icon name={l.icon} className="h-5 w-5" />
                    {l.label}
                  </a>
                ))}
              </div>
              <a href={storeLocatorUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-between gap-4 rounded-full bg-[var(--nx-black)] py-2.5 pl-6 pr-2.5 text-white">
                <span>
                  <span className="nx-bold block text-[15px] uppercase tracking-[0.04em]">Find another NEXT store</span>
                  <span className={`block ${SMALL} text-white/65`}>Nearest stores across India</span>
                </span>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--nx-glow)] text-black">
                  <Icon name="arrow" className="h-5 w-5" />
                </span>
              </a>
            </div>
          </section>
        </div>

        {/* ============================== CLOSING ============================== */}
        <footer>
          <div className="nx-grain relative overflow-hidden rounded-t-[44px] bg-[var(--nx-black)] pb-7 text-white">
            <div aria-hidden="true" className="overflow-hidden py-5">
              <div className="nx-marquee flex w-max">
                {[0, 1].map((k) => (
                  <span key={k} className="flex shrink-0 items-center gap-6 pr-6">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="flex items-center gap-6">
                        <span className="nx-bold text-[64px] uppercase leading-none tracking-[-0.02em]" style={{ WebkitTextStroke: "1.5px rgba(255,190,154,0.9)", color: "transparent" }}>See you soon</span>
                        <span className="text-[34px] leading-none text-[var(--nx-glow)]">✦</span>
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative px-5 pt-2">
              <BrandImage src={logoSrc} alt="NEXT" width={320} height={80} className="h-7 w-auto max-w-[55%] object-contain object-left brightness-0 invert" fallbackClassName="nx-bold inline-block text-[24px] uppercase leading-none tracking-[0.34em] text-white" />
              <p className={`mt-4 ${BODY} text-white/70`}>Thank you for shopping with us. See you in store soon.</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className={`${CAPS} text-white/55`}>Invoice no</p>
                  <p className="nx-bold mt-1 break-all text-[13px] tabular-nums">{data.invoiceNo}</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className={`${CAPS} text-white/55`}>Date</p>
                  <p className="nx-bold mt-1 text-[13px] tabular-nums">{data.date}</p>
                </div>
              </div>
              <div className="mt-2 rounded-3xl bg-white/10 p-4">
                <p className={`${CAPS} nx-bold text-white`}>Registered office</p>
                <p className={`mt-1.5 ${SMALL} text-white/70`}>{data.registeredOffice}</p>
              </div>
              <div className="mt-5 flex justify-end">
                <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" className={`nx-bold flex items-center gap-1.5 rounded-full bg-[var(--nx-glow)] px-5 py-3 text-[12px] uppercase tracking-[0.14em] text-black ${focusRing}`}>
                  Top <Icon name="arrow" className="h-3.5 w-3.5 -rotate-90" />
                </button>
              </div>
            </div>
          </div>
          <div className={`flex items-center justify-center gap-2.5 bg-white px-5 py-4 ${CAPS} text-[var(--nx-gray)]`}>
            <span>Powered by</span>
            <BrandImage src={rdepLogoSrc} alt="rdep" width={240} height={80} className="h-7 w-auto" fallbackClassName="text-lg font-bold tracking-tight text-[var(--nx-black)]" />
          </div>
          <div aria-hidden="true" className="h-28 bg-white" />
        </footer>
      </main>

      {/* ---------------------------- Progress line ---------------------------- */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px]">
        <div className="h-full rounded-r-full bg-[var(--nx-coral)]" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* ---------------------------- Bottom dock ---------------------------- */}
      {!modal && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
          <div style={zoomStyle(scale)} className="w-[400px] px-3 pb-[max(10px,env(safe-area-inset-bottom))]">
            {activeGroup.items.length > 1 && (
              <div key={activeGroup.id} className="nx-pop pointer-events-auto mb-2 flex justify-center">
                <div className="flex gap-1 rounded-full bg-white/95 p-1 shadow-[0_14px_28px_-12px_rgba(11,11,12,0.55)] backdrop-blur">
                  {activeGroup.items.map((i) => (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => go(i.id)}
                      aria-current={i.id === active ? "true" : undefined}
                      className={`nx-bold rounded-full px-4 py-2.5 text-[12px] ${i.id === active ? "bg-[var(--nx-black)] text-white" : "text-[var(--nx-black)]"} ${focusRing}`}
                    >
                      {i.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <nav
              aria-label="Receipt sections"
              className="pointer-events-auto relative grid rounded-[32px] bg-[rgba(11,11,12,0.95)] p-1.5 shadow-[0_22px_40px_-14px_rgba(11,11,12,0.75)] backdrop-blur-md"
              style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-1.5 left-1.5 rounded-[26px] bg-[var(--nx-glow)] transition-transform duration-300 ease-[cubic-bezier(.3,.8,.3,1)] motion-reduce:transition-none"
                style={{ width: `calc((100% - 12px) / ${groups.length})`, transform: `translateX(${activeGroupIdx * 100}%)` }}
              />
              {groups.map((g, gi) => {
                const on = gi === activeGroupIdx;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => go(g.items[0].id)}
                    aria-current={on ? "true" : undefined}
                    className={`nx-bold relative z-10 flex flex-col items-center gap-1 rounded-[26px] py-2.5 text-[11px] uppercase tracking-[0.08em] transition-colors ${on ? "text-black" : "text-white/70"} ${focusRing}`}
                  >
                    <Icon name={g.icon} className="h-5 w-5" />
                    {g.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ---------------------------- Coupon: use in store ---------------------------- */}
      {modal === "coupon" && couponSheet && (
        <Modal title="Show at billing" onClose={() => { closeModal(); setCouponSheet(null); }} scale={scale} dark>
          <div className="overflow-hidden rounded-[32px] bg-white text-[var(--nx-black)]">
            <div className={`p-5 ${kindStyle[couponSheet.kind].bg}`}>
              <p className="nx-bold text-[44px] uppercase leading-[0.9] tracking-[-0.03em]">{couponSheet.value}</p>
              <p className="nx-bold mt-3 text-[14px] uppercase">{couponSheet.title}</p>
              <p className={`mt-1 ${SMALL} text-black/70`}>{couponSheet.description}</p>
            </div>
            <div className="relative">
              <span aria-hidden="true" className="absolute -left-3.5 -top-3.5 h-7 w-7 rounded-full bg-[var(--nx-black)]" />
              <span aria-hidden="true" className="absolute -right-3.5 -top-3.5 h-7 w-7 rounded-full bg-[var(--nx-black)]" />
              <div className="border-t-2 border-dashed border-black/20" />
            </div>
            <div className="p-5 text-center">
              <Barcode seed={couponSheet.code} className="mx-auto h-24 w-full max-w-[280px]" />
              <p className="nx-bold mt-3 text-[26px] tracking-[0.18em]">{couponSheet.code}</p>
              <p className={`mt-1 ${SMALL} text-[var(--nx-gray)]`}>Valid till {couponSheet.validTill}</p>
            </div>
          </div>
          <p className={`mt-4 text-center ${BODY} text-white/70`}>Hand your phone to the associate. They will apply it to your next bill.</p>
          <button type="button" onClick={() => copyCode(couponSheet.code)} aria-live="polite" className={`${glowBtn} mt-4`}>
            <Icon name="copy" className="h-4 w-4" />
            {couponCopied === couponSheet.code ? "Code copied" : "Copy code"}
          </button>
        </Modal>
      )}

      {/* ---------------------------- Transaction History ---------------------------- */}
      {modal === "history" && (
        <Modal title="Transaction history" onClose={closeModal} scale={scale}>
          <div className="mb-4 flex items-center justify-between rounded-3xl bg-[var(--nx-paper)] p-4">
            <div>
              <p className={`${CAPS} text-[var(--nx-gray)]`}>Total receipts</p>
              <p className={`${LABEL} mt-1 text-[var(--nx-black)]`}>{history.length} recorded</p>
            </div>
            <div className="text-right">
              <p className={`${CAPS} text-[var(--nx-gray)]`}>Viewing</p>
              <p className={`${LABEL} mt-1 tabular-nums text-[var(--nx-black)]`}>#{data.invoiceNo.slice(-4)}</p>
            </div>
          </div>
          <ol className="space-y-2.5">
            {history.map((h) => (
              <li key={h.invoiceNo}>
                <div className={`flex items-center justify-between gap-3 rounded-[26px] p-4 ${h.current ? "bg-[var(--nx-black)] text-white" : "bg-[var(--nx-paper)] text-[var(--nx-black)]"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`${LABEL} tabular-nums`}>No. {h.invoiceNo}</span>
                      {h.current && <span className="nx-bold rounded-full bg-[var(--nx-glow)] px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-black">Current</span>}
                    </div>
                    <p className={`mt-1 truncate ${SMALL} ${h.current ? "text-white/70" : "text-[var(--nx-gray)]"}`}>{h.date} &middot; {h.storeName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <span className={`${AMOUNT} block`}>₹{inr(h.amount)}</span>
                      <span className={`block ${SMALL} ${h.current ? "text-white/65" : "text-[var(--nx-gray)]"}`}>{h.items} {h.items === 1 ? "piece" : "pieces"}</span>
                    </div>
                    {!h.current && (
                      <button type="button" onClick={() => { closeModal(); onSelect(h.invoiceNo); }} aria-label={`Open receipt ${h.invoiceNo}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--nx-black)] text-white">
                        <Icon name="arrow" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Modal>
      )}

      {/* ---------------------------- QR popup ---------------------------- */}
      {modal === "qr" && (
        <Modal title="Receipt QR code" onClose={closeModal} scale={scale}>
          <div className="flex flex-col items-center py-2 text-center">
            <div className="mb-5 h-56 w-56 rounded-[32px] border-4 border-[var(--nx-black)] bg-white p-4">
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrSrc} alt="Receipt QR code" className="h-full w-full object-contain" />
              ) : (
                <PlaceholderQR seed={data.invoiceNo} />
              )}
            </div>
            <p className={`${LABEL} tabular-nums text-[var(--nx-black)]`}>Invoice #{data.invoiceNo}</p>
            <p className={`mt-1 max-w-[280px] ${BODY}`}>Scan this code at the store counter for instant returns or inquiries.</p>
          </div>
        </Modal>
      )}

      {/* ---------------------------- Email popup ---------------------------- */}
      {modal === "email" && (
        <Modal title="Email this receipt" onClose={closeModal} scale={scale}>
          <form
            className="space-y-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!emailOk(email)) {
                setEmailErr("Enter a valid email address, like name@example.com.");
                return;
              }
              setEmailErr("");
              onSendEmail?.(email, data);
              setSentTo(email);
            }}
          >
            <label className="block">
              <span className={fieldLabel}>Email address</span>
              <input type="email" value={email} onChange={(e) => { setSentTo(""); setEmailErr(""); setEmail(e.target.value); }} className={fieldInput} autoComplete="email" aria-invalid={!!emailErr} />
              {emailErr && <span role="alert" className="nx-bold mt-1.5 block text-[13px] text-[var(--nx-coral)]">{emailErr}</span>}
            </label>
            <button type="submit" className={solidBtn}>Send receipt</button>
            <p aria-live="polite" className={sentTo ? `${LABEL} flex items-center justify-center gap-1.5 text-[var(--nx-black)]` : "sr-only"}>
              {sentTo && (<><Icon name="check" className="h-4 w-4" /> Receipt sent to {sentTo}</>)}
            </p>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------------- main ------------------------------------------ */
export default function NextReceipt({ data, receipts, onSelectReceipt, ...rest }: NextReceiptProps) {
  const list = useMemo(() => {
    const base = receipts ?? (data ? [data] : sampleNextReceipts);
    const merged = data && !base.some((r) => r.invoiceNo === data.invoiceNo) ? [data, ...base] : base;
    return [...merged].sort((a, b) => dateValue(b.date) - dateValue(a.date));
  }, [data, receipts]);

  const [currentId, setCurrentId] = useState(data?.invoiceNo ?? list[0].invoiceNo);
  const current = list.find((r) => r.invoiceNo === currentId) ?? list[0];

  const history = useMemo<HistoryRow[]>(
    () =>
      list.map((r) => {
        const t = totalsOf(r);
        return { invoiceNo: r.invoiceNo, date: r.date.split(" ")[0], storeName: r.store.name, amount: t.total, items: t.pieces, current: r.invoiceNo === current.invoiceNo };
      }),
    [list, current.invoiceNo],
  );

  const select = useCallback(
    (invoiceNo: string) => {
      setCurrentId(invoiceNo);
      onSelectReceipt?.(invoiceNo);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [onSelectReceipt],
  );

  return <ReceiptView key={current.invoiceNo} data={current} history={history} onSelect={select} {...rest} />;
}
