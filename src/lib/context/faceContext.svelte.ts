import type { StoredFace } from "$lib/types/faceStore";
import { Context } from "runed";

interface FaceContext {
    face: StoredFace;
}

export const faceContext = new Context<FaceContext>("faceContext");
