import type { Face } from "$lib/types/data";
import { Context } from "runed";

interface EditorContext {
    face: Face;
}

export const editorContext = new Context<EditorContext>("editorContext");
