import type { SharedRenderer } from "$lib/render/sharedRenderer";
import { Context } from "runed";
import type { WebGLRenderer } from "three";

export const rendererContext = new Context<SharedRenderer>("rendererContext");
