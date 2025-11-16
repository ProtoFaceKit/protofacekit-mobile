import type { StoredFace } from "$lib/types/faceStore";
import { load } from "@tauri-apps/plugin-store";
import { Mutex } from "async-mutex";

const FACES_KEY = "faces" as const;

const facesStore = await load("facesStore.json", {
    autoSave: false,
    defaults: {
        [FACES_KEY]: [],
    },
});

const facesMutex = new Mutex();

export interface FaceStore {
    /** Loading state */
    loading: boolean;

    /** Error if loading failed */
    error: unknown | undefined;

    /** Loaded face data */
    faces: StoredFace[];

    /** Append a face to the store */
    appendFace: (face: StoredFace) => Promise<void>;

    /** Remove a face from the store */
    removeFace: (id: string) => Promise<void>;
}

export function createFaceStore(): FaceStore {
    let loading = $state(false);
    let error: unknown | undefined = $state(undefined);
    let faces: StoredFace[] = $state([]);

    // Initial stored faces fetch
    $effect(() => {
        let canceled = false;

        getStoredFaces()
            .then((value) => {
                if (canceled) return;
                faces = value;
            })
            .catch((value) => {
                if (canceled) return;
                error = value;
            });

        return () => {
            canceled = true;
        };
    });

    return {
        get loading() {
            return loading;
        },
        get error() {
            return error;
        },
        get faces() {
            return faces;
        },
        appendFace: async (face) => {
            faces = await appendStoredFace(face);
        },
        removeFace: async (id) => {
            faces = await removeStoredFace(id);
        },
    };
}

async function getStoredFaces() {
    const value = await facesStore.get<StoredFace[]>(FACES_KEY);
    return value ?? [];
}

async function appendStoredFace(face: StoredFace) {
    return facesMutex.runExclusive(async () => {
        const faces = await getStoredFaces();
        const newFaces = [...faces, face];
        await facesStore.set(FACES_KEY, newFaces);
        await facesStore.save();
        return newFaces;
    });
}

async function removeStoredFace(id: string) {
    return facesMutex.runExclusive(async () => {
        const faces = await getStoredFaces();
        const newFaces = faces.filter((face) => face.id !== id);
        await facesStore.set(FACES_KEY, newFaces);
        await facesStore.save();
        return newFaces;
    });
}
