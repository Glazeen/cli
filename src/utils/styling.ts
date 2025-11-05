import chalk from "chalk";
import gradient from "gradient-string";

const blueGradient = gradient("cyan", "blue");

export const renderTitle = () => {
    const title = `Glazeen`;
    console.log(blueGradient(title));
};

export const success = `${chalk.green("✔")}`;
export const error = `${chalk.red("✖")}`;
export const info = `${chalk.blue("ℹ")}`;

export const link = (url: string) => chalk.cyan.underline(url);
export const code = (text: string) => chalk.bgGray.white(text);
export const bold = (text: string) => chalk.bold(text);
