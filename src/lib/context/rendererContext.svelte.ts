import type { SharedRenderer } from "$lib/render/sharedRenderer";
import { Context } from "runed";

export const rendererContext = new Context<SharedRenderer>("rendererContext");
