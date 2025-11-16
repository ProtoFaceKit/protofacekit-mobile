import { Context } from "runed";
import type { WebGLRenderer } from "three";

export const rendererContext = new Context<WebGLRenderer>("rendererContext");
