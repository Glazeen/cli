import os from "os";
import pc from "picocolors";

/** Brand colors, from glazeen.ai */
export const BRAND_COLOR = "#0068FA";
/** Lighter brand blue, readable as text on both dark and light terminals */
const ACCENT_COLOR = "#458BF3";

export const WEBSITE = "https://glazeen.ai";
const TAGLINE = "Scaffold new projects from templates";

type Rgb = [number, number, number];
const toRgb = (hex: string) =>
	[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;

const { env } = process;
const isModernTerminal =
	Boolean(env.WT_SESSION) ||
	["iTerm.app", "vscode", "WezTerm", "ghostty"].includes(
		env.TERM_PROGRAM ?? "",
	);

/** 0: no colors, 1: 16 colors, 2: 256 colors, 3: true color */
const colorLevel = (() => {
	if (!pc.isColorSupported) return 0;
	if (
		env.COLORTERM === "truecolor" ||
		env.COLORTERM === "24bit" ||
		isModernTerminal
	)
		return 3;
	// The Windows 10 console supports true color since build 14931
	if (process.platform === "win32")
		return Number(os.release().split(".")[2]) >= 14931 ? 3 : 1;
	if (/-256(colou?r)?$/i.test(env.TERM ?? "")) return 2;
	return 1;
})();

/** Nearest color of the xterm 6×6×6 color cube */
const to256 = ([r, g, b]: Rgb) =>
	16 + 36 * Math.round(r / 51) + 6 * Math.round(g / 51) + Math.round(b / 51);
const fg = (hex: string) =>
	colorLevel === 3
		? `\x1b[38;2;${toRgb(hex).join(";")}m`
		: `\x1b[38;5;${to256(toRgb(hex))}m`;
const bg = (hex: string) =>
	colorLevel === 3
		? `\x1b[48;2;${toRgb(hex).join(";")}m`
		: `\x1b[48;5;${to256(toRgb(hex))}m`;

/** Highlights names, paths and commands in brand blue (cyan on basic terminals) */
export const accent = (text: string) =>
	colorLevel >= 2 ? `${fg(ACCENT_COLOR)}${text}\x1b[39m` : pc.cyan(text);

/** White bold text on brand blue */
export const badge = (text: string) =>
	colorLevel >= 2
		? `${bg(BRAND_COLOR)}${pc.white(pc.bold(text))}\x1b[49m`
		: pc.bgBlue(pc.white(pc.bold(text)));

/** Clickable link in terminals that support OSC 8 hyperlinks, plain text elsewhere */
export const link = (text: string, url: string) =>
	pc.isColorSupported &&
	(isModernTerminal || env.KITTY_WINDOW_ID || Number(env.VTE_VERSION) >= 5000)
		? `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`
		: text;

// The bear from the Glazeen logo, downsampled to 18×20 pixels using the logo's own palette.
// Each terminal row shows two pixel rows with the half block characters ▀ and ▄.
const BEAR_PALETTE: Record<string, string> = {
	a: "#458BF3",
	b: "#A1C5FA",
	c: "#9FC7FF",
	d: "#8BBBFF",
	e: "#75ABF6",
	f: "#76AFFF",
	g: "#DFECFF",
	h: "#0069F7",
	i: "#F1F7FF",
	j: "#B8D5FF",
	k: "#0357D6",
	l: "#0155D4",
	m: "#01348F",
	n: "#02358C",
	o: "#0056D8",
};
const BEAR = [
	"     a    abc      ",
	"    adefggehea     ",
	"    adiijbehaaa    ",
	"    cgijbbbeaaeah  ",
	"   fjeebbbbbeheeea ",
	"   dgkkaaedbbeeeee ",
	"  jgjakaaaaaeddeee ",
	" lejjblkaaakaaaeee ",
	" maddckkkaanaaaeee ",
	" kaedanlllknaaaeee ",
	"  keeknnnnnnaakeee ",
	"      nnnnnlakkeee ",
	"       nnnnklnaeee ",
	"       nlnnnnneeak ",
	"       nllnnnkeeko ",
	"        nlnnnaekoo ",
	"         nnnnekooo ",
	"          nnkhoooo ",
	"           nnloooo ",
	"             nlooo ",
];

const WORDMARK = [
	" ██████  ██       █████  ███████ ███████ ███████ ███    ██",
	"██       ██      ██   ██    ███  ██      ██      ████   ██",
	"██   ███ ██      ███████   ███   █████   █████   ██ ██  ██",
	"██    ██ ██      ██   ██  ███    ██      ██      ██  ██ ██",
	" ██████  ███████ ██   ██ ███████ ███████ ███████ ██   ████",
];
/** Top to bottom, from light blue to the brand blue */
const WORDMARK_GRADIENT = [
	"#B8D5FF",
	"#8BBBFF",
	"#76AFFF",
	"#458BF3",
	"#0069F7",
];

const renderBear = () => {
	const lines: string[] = [];
	for (let y = 0; y < BEAR.length; y += 2) {
		let line = "";
		for (let x = 0; x < BEAR[y].length; x++) {
			const top = BEAR_PALETTE[BEAR[y][x]];
			const bottom = BEAR_PALETTE[BEAR[y + 1][x]];
			if (top && bottom) line += `${fg(top)}${bg(bottom)}▀\x1b[39;49m`;
			else if (top) line += `${fg(top)}▀\x1b[39m`;
			else if (bottom) line += `${fg(bottom)}▄\x1b[39m`;
			else line += " ";
		}
		lines.push(line);
	}
	return lines;
};

const GAP = "   ";

/**
 * Prints the bear and the Glazeen wordmark. Uses a compact version on narrow terminals
 * and prints nothing when the output isn't an interactive terminal with 256+ colors.
 */
export const printBanner = () => {
	const columns = process.stdout.columns ?? 0;
	const bearWidth = BEAR[0].length;
	if (
		!process.stdout.isTTY ||
		colorLevel < 2 ||
		columns < bearWidth + GAP.length + TAGLINE.length + 1
	)
		return;

	const website = accent(link(WEBSITE.replace("https://", ""), WEBSITE));
	const wide = columns > bearWidth + GAP.length + WORDMARK[0].length;
	const text = wide
		? [
				"",
				...WORDMARK.map(
					(line, i) => `${fg(WORDMARK_GRADIENT[i])}${line}\x1b[39m`,
				),
				"",
				pc.dim(TAGLINE),
				website,
			]
		: ["", "", "", pc.bold(accent("Glazeen")), pc.dim(TAGLINE), website];

	const lines = renderBear().map((bear, i) =>
		(text[i] ? `${bear}${GAP}${text[i]}` : bear).trimEnd(),
	);
	process.stdout.write(`\n${lines.join("\n")}\n\n`);
};
