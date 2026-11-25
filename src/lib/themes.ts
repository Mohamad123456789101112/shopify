export type ThemeTokens = {
  id: string;
  name: string;
  nameAr: string;
  tag: string;
  bg: string;
  text: string;
  muted: string;
  accent: string;
  surface: string;
  line: string;
  headingFont: string;
  bodyFont: string;
  headingWeight: number;
  letterSpacing: string;
  uppercase: boolean;
  radius: number;
  button: "solid" | "outline" | "underline";
  nav: "center" | "left" | "split";
  card: "plain" | "rounded" | "framed";
};

export const THEMES: ThemeTokens[] = [
  {
    id: "atelier", name: "Atelier", nameAr: "أتيليه", tag: "Editorial activewear",
    bg: "#ffffff", text: "#111111", muted: "#6f6a64", accent: "#111111", surface: "#f1efeb", line: "#e6e1da",
    headingFont: "manrope", bodyFont: "manrope", headingWeight: 600, letterSpacing: "0.12em", uppercase: true,
    radius: 0, button: "underline", nav: "center", card: "plain",
  },
  {
    id: "noir", name: "Noir", nameAr: "نوار", tag: "Luxury jewellery, black & gold",
    bg: "#0b0b0c", text: "#f4efe6", muted: "#9c948a", accent: "#c9a75a", surface: "#151517", line: "#26262a",
    headingFont: "playfair", bodyFont: "manrope", headingWeight: 600, letterSpacing: "0.02em", uppercase: false,
    radius: 0, button: "outline", nav: "center", card: "plain",
  },
  {
    id: "maison", name: "Maison", nameAr: "ميزون", tag: "Leather goods, warm",
    bg: "#f7f3ee", text: "#2b2622", muted: "#8a7f75", accent: "#8b5e3c", surface: "#efe8df", line: "#e3d9cd",
    headingFont: "playfair", bodyFont: "manrope", headingWeight: 600, letterSpacing: "0em", uppercase: false,
    radius: 14, button: "solid", nav: "left", card: "rounded",
  },
  {
    id: "street", name: "Street", nameAr: "ستريت", tag: "Streetwear, neon",
    bg: "#111111", text: "#ffffff", muted: "#a3a3a3", accent: "#e0ff3c", surface: "#1c1c1c", line: "#2d2d2d",
    headingFont: "sora", bodyFont: "sora", headingWeight: 800, letterSpacing: "-0.03em", uppercase: true,
    radius: 6, button: "solid", nav: "split", card: "framed",
  },
  {
    id: "modest", name: "Modest", nameAr: "مودست", tag: "Abayas & modest wear",
    bg: "#fbf8f4", text: "#3a2f2a", muted: "#9a8b82", accent: "#b07a5a", surface: "#f3ece5", line: "#e8ded3",
    headingFont: "playfair", bodyFont: "plexar", headingWeight: 500, letterSpacing: "0.01em", uppercase: false,
    radius: 999, button: "solid", nav: "center", card: "rounded",
  },
  {
    id: "rose", name: "Rose", nameAr: "روزيه", tag: "Lingerie, blush",
    bg: "#fff7f5", text: "#3b2a2e", muted: "#a58a90", accent: "#d67b8a", surface: "#fceeee", line: "#f6dede",
    headingFont: "playfair", bodyFont: "manrope", headingWeight: 500, letterSpacing: "0em", uppercase: false,
    radius: 18, button: "solid", nav: "center", card: "rounded",
  },
  {
    id: "sahara", name: "Sahara", nameAr: "صحارى", tag: "Resort & sand",
    bg: "#f4ecdf", text: "#3d2f24", muted: "#8f7d6b", accent: "#c8643a", surface: "#ebdfcd", line: "#ded0b8",
    headingFont: "fredoka", bodyFont: "manrope", headingWeight: 600, letterSpacing: "0em", uppercase: false,
    radius: 10, button: "solid", nav: "left", card: "rounded",
  },
  {
    id: "monochrome", name: "Monochrome", nameAr: "مونوكروم", tag: "Tailoring, black & white",
    bg: "#ffffff", text: "#000000", muted: "#777777", accent: "#000000", surface: "#f4f4f4", line: "#e3e3e3",
    headingFont: "sora", bodyFont: "manrope", headingWeight: 700, letterSpacing: "-0.04em", uppercase: true,
    radius: 0, button: "solid", nav: "split", card: "framed",
  },
  {
    id: "riviera", name: "Riviera", nameAr: "ريفييرا", tag: "Swimwear, navy & cream",
    bg: "#f8f6f0", text: "#12233d", muted: "#6d7889", accent: "#1f4e79", surface: "#eef0f4", line: "#dde2ea",
    headingFont: "playfair", bodyFont: "manrope", headingWeight: 600, letterSpacing: "0.06em", uppercase: true,
    radius: 4, button: "outline", nav: "center", card: "plain",
  },
  {
    id: "velvet", name: "Velvet", nameAr: "فيلفت", tag: "Evening wear, plum",
    bg: "#1a1220", text: "#f3e9dc", muted: "#a898a8", accent: "#d4b483", surface: "#241a2c", line: "#33253c",
    headingFont: "playfair", bodyFont: "manrope", headingWeight: 500, letterSpacing: "0.08em", uppercase: true,
    radius: 2, button: "outline", nav: "center", card: "plain",
  },
];

export const getTheme = (id: string | undefined) => THEMES.find((t) => t.id === id) ?? THEMES[0];
