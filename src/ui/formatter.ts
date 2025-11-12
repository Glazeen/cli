// import chalk from "chalk";
// import { currentConfig } from "./config";

// // Color schemes for different accessibility needs
// const colorSchemes = {
//     default: {
//         primary: "#2962FF",
//         success: "#4CAF50",
//         warning: "#FF9800",
//         error: "#F44336",
//         info: "#2196F3",
//         muted: "#9E9E9E",
//         accent: "#42A5F5"
//     },
//     accessible: {
//         primary: "#1565C0",
//         success: "#2E7D32",
//         warning: "#E65100",
//         error: "#C62828",
//         info: "#0277BD",
//         muted: "#616161",
//         accent: "#1976D2"
//     },
//     monochrome: {
//         primary: "#000000",
//         success: "#000000",
//         warning: "#000000",
//         error: "#000000",
//         info: "#000000",
//         muted: "#666666",
//         accent: "#000000"
//     }
// };

// export function getColor(colorName: keyof typeof colorSchemes.default) {
//     if (!currentConfig.colors) {
//         return (text: string) => text;
//     }

//     const scheme = colorSchemes[currentConfig.colorScheme];
//     return chalk.hex(scheme[colorName]);
// }

// // ASCII art borders and dividers
// export const borders = {
//     single: {
//         top: "─",
//         bottom: "─",
//         left: "│",
//         right: "│",
//         topLeft: "┌",
//         topRight: "┐",
//         bottomLeft: "└",
//         bottomRight: "┘"
//     },
//     double: {
//         top: "═",
//         bottom: "═",
//         left: "║",
//         right: "║",
//         topLeft: "╔",
//         topRight: "╗",
//         bottomLeft: "╚",
//         bottomRight: "╝"
//     },
//     rounded: {
//         top: "─",
//         bottom: "─",
//         left: "│",
//         right: "│",
//         topLeft: "╭",
//         topRight: "╮",
//         bottomLeft: "╰",
//         bottomRight: "╯"
//     }
// };

// export function createDivider(
//     width: number = currentConfig.terminalWidth,
//     style: "single" | "double" | "rounded" = "single"
// ) {
//     if (!currentConfig.decorations) return "";
//     return borders[style].top.repeat(width);
// }

// export function createBox(
//     content: string,
//     title?: string,
//     style: "single" | "double" | "rounded" = "rounded"
// ) {
//     if (!currentConfig.decorations) return content;

//     const lines = content.split("\n");
//     const maxWidth = Math.max(...lines.map((line) => line.length));
//     const width = Math.min(maxWidth + 4, currentConfig.terminalWidth - 2);

//     const border = borders[style];
//     const horizontalLine = border.top.repeat(width);

//     let result = `${border.topLeft}${horizontalLine}${border.topRight}\n`;

//     if (title) {
//         const titleLine = ` ${title} `.padEnd(width, " ");
//         result += `${border.left}${titleLine}${border.right}\n`;
//         result += `${border.left}${border.top.repeat(width)}${border.right}\n`;
//     }

//     lines.forEach((line) => {
//         const paddedLine = line.padEnd(width, " ");
//         result += `${border.left}${paddedLine}${border.right}\n`;
//     });

//     result += `${border.bottomLeft}${horizontalLine}${border.bottomRight}`;
//     return result;
// }

// // Table formatting
// export interface TableColumn {
//     header: string;
//     key: string;
//     width?: number;
//     align?: "left" | "center" | "right";
// }

// export function formatTable(
//     data: Record<string, any>[],
//     columns: TableColumn[]
// ) {
//     if (currentConfig.machineReadable) {
//         return JSON.stringify(data, null, 2);
//     }

//     // Calculate column widths
//     const calculatedColumns = columns.map((col) => ({
//         ...col,
//         width:
//             col.width ||
//             Math.max(
//                 col.header.length,
//                 ...data.map((row) => String(row[col.key] || "").length)
//             ) + 2
//     }));

//     // Create header
//     const header = calculatedColumns
//         .map((col) => col.header.padEnd(col.width, " "))
//         .join("│");

//     // Create separator
//     const separator = calculatedColumns
//         .map((col) => "─".repeat(col.width))
//         .join("┼");

//     // Create rows
//     const rows = data.map((row) =>
//         calculatedColumns
//             .map((col) => {
//                 const value = String(row[col.key] || "");
//                 if (col.align === "center") {
//                     return value
//                         .padStart((col.width + value.length) / 2)
//                         .padEnd(col.width);
//                 } else if (col.align === "right") {
//                     return value.padStart(col.width);
//                 }
//                 return value.padEnd(col.width);
//             })
//             .join("│")
//     );

//     return [header, separator, ...rows].join("\n");
// }

// // Progress indicators
// export function createProgressBar(
//     current: number,
//     total: number,
//     width: number = 40
// ) {
//     if (!currentConfig.decorations) return `${current}/${total}`;

//     const percentage = Math.round((current / total) * 100);
//     const filledWidth = Math.round((current / total) * width);
//     const emptyWidth = width - filledWidth;

//     const filled = "█".repeat(filledWidth);
//     const empty = "░".repeat(emptyWidth);

//     const color =
//         percentage === 100
//             ? getColor("success")
//             : percentage >= 50
//             ? getColor("primary")
//             : getColor("warning");

//     return `${color(filled)}${empty} ${percentage}%`;
// }

// // Status indicators
// export const statusIcons = {
//     success: "✔",
//     error: "✖",
//     warning: "⚠",
//     info: "ℹ",
//     question: "?",
//     arrow: "→",
//     bullet: "•",
//     star: "★",
//     heart: "❤",
//     check: "✓",
//     cross: "✗"
// };

// // Timestamp formatting
// export function formatTimestamp(date: Date = new Date()) {
//     if (!currentConfig.timestamp) return "";
//     return `[${date.toISOString()}] `;
// }

// // Machine-readable output formatting
// export function formatMachineOutput(type: string, data: any) {
//     return JSON.stringify({
//         timestamp: new Date().toISOString(),
//         type,
//         data
//     });
// }

// // Word wrapping for long text
// export function wrapText(
//     text: string,
//     maxWidth: number = currentConfig.terminalWidth - 4
// ) {
//     if (text.length <= maxWidth) return text;

//     const words = text.split(" ");
//     const lines: string[] = [];
//     let currentLine = "";

//     for (const word of words) {
//         if ((currentLine + word).length <= maxWidth) {
//             currentLine += (currentLine ? " " : "") + word;
//         } else {
//             if (currentLine) lines.push(currentLine);
//             currentLine = word;
//         }
//     }
//     if (currentLine) lines.push(currentLine);

//     return lines.join("\n");
// }
