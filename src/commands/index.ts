import type { Command } from "@/terminal/types";
import { authCommands } from "./auth";
import { linkCommands } from "./links";
import { statsCommand } from "./stats";
import { qrCommand } from "./qr";
import { help, systemCommands } from "./system";

export const commands: Command[] = [help, ...authCommands, ...linkCommands, statsCommand, qrCommand, ...systemCommands];
export const findCommand = (name: string) => commands.find((c) => c.name === name || c.aliases?.includes(name));