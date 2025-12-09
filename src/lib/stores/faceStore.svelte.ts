import type { StoredFace } from "$lib/types/faceStore";
import { load, Store } from "@tauri-apps/plugin-store";
import { Mutex } from "async-mutex";

const FACES_KEY = "faces" as const;

let facesStore: Store | null = null;

async function getFacesStore() {
    if (facesStore === null) {
        facesStore = await load("facesStore.json", {
            autoSave: false,
            defaults: {
                [FACES_KEY]: [],
            },
        });
    }

    return facesStore;
}

const facesMutex = new Mutex();

export interface FaceStore {
    /** Loading state */
    loading: boolean;

    /** Error if loading failed */
    error: unknown | undefined;

    /** Loaded face data */
    faces: StoredFace[];

    /** Get a promise to load the stored faces */
    load(): Promise<StoredFace[]>;

    /** Append a face to the store */
    appendFace: (face: StoredFace) => Promise<void>;

    /** Update a stored face */
    updateFace: (face: StoredFace) => Promise<void>;

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
        load: async () => {
            try {
                const value = await getStoredFaces();
                faces = value;
                return value;
            } catch (err) {
                error = err;
                throw err;
            }
        },
        appendFace: async (face) => {
            faces = await appendStoredFace(face);
        },
        updateFace: async (face) => {
            faces = await updateStoredFace(face);
        },
        removeFace: async (id) => {
            faces = await removeStoredFace(id);
        },
    };
}

async function getStoredFaces() {
    const facesStore = await getFacesStore();
    const value = await facesStore.get<StoredFace[]>(FACES_KEY);
    return value ?? [];
}

async function appendStoredFace(face: StoredFace) {
    return facesMutex.runExclusive(async () => {
        const facesStore = await getFacesStore();
        const faces = await getStoredFaces();
        const newFaces = [...faces, face];
        await facesStore.set(FACES_KEY, newFaces);
        await facesStore.save();
        return newFaces;
    });
}

async function updateStoredFace(face: StoredFace) {
    return facesMutex.runExclusive(async () => {
        const facesStore = await getFacesStore();
        const faces = await getStoredFaces();
        const newFaces = faces.map((otherFace) => {
            if (otherFace.id === face.id) {
                return face;
            } else {
                return otherFace;
            }
        });
        await facesStore.set(FACES_KEY, newFaces);
        await facesStore.save();
        return newFaces;
    });
}

async function removeStoredFace(id: string) {
    return facesMutex.runExclusive(async () => {
        const facesStore = await getFacesStore();
        const faces = await getStoredFaces();
        const newFaces = faces.filter((face) => face.id !== id);
        await facesStore.set(FACES_KEY, newFaces);
        await facesStore.save();
        return newFaces;
    });
}
