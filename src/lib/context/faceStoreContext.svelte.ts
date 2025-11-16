import type { FaceStore } from "$lib/stores/faceStore.svelte";
import { Context } from "runed";

export const faceStoreContext = new Context<FaceStore>("faceStoreContext");
