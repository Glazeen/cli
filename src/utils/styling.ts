import chalk from "chalk";
import gradient from "gradient-string";
import { logger } from "../ui/logger";

// Define your brand's core colors based on the logo
const glazeenColors = {
    primaryBlue: "#2962FF", // A vibrant blue from the logo text
    gradientStart: "#42A5F5", // A lighter blue from the bear graphic
    gradientEnd: "#1565C0" // A darker blue from the bear graphic
};

// Create a custom gradient for titles
const glazeenGradient = gradient(
    glazeenColors.gradientStart,
    glazeenColors.gradientEnd
);

/**
 * Renders the title with a gradient matching the brand's logo.
 */
// export const renderTitle = () => {
//     const title = `@glazeen/cli`;
//     logger.brand();
// };

// /**
//  * Styled section title.
//  */
// export const sectionTitle = (text: string) =>
//     `${chalk.hex(glazeenColors.primaryBlue)("🔹")} ${glazeenGradient(text)}`;

// // Styled console message prefixes
// export const success = `${chalk.green("✔")}`;
// export const error = `${chalk.red("✖")}`;
// export const info = `${chalk.hex(glazeenColors.primaryBlue)("ℹ")}`;

// // Styled text formatting functions
// export const link = (url: string) =>
//     chalk.hex(glazeenColors.primaryBlue).underline(url);
// export const code = (text: string) =>
//     chalk.bgHex(glazeenColors.gradientStart).hex("#000000").bold(text);
// export const bold = (text: string) => chalk.bold(text);
// export const underline = (text: string) => chalk.underline(text);
