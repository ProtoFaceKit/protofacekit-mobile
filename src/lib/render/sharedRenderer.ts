import { WebGLRenderer, type Camera, type Object3D } from "three";

/**
 * Shared rendering abstraction that allows a single WebGL rendering
 * context to be used to render many scenes to different canvases
 *
 * Created to get around the limit that browser have of ~32 web gl
 * contexts per page which I hit pretty quickly with all the 3D
 * rendered face frames.
 */
export interface SharedRenderer {
    /**
     * The underlying renderer context
     */
    renderer: WebGLRenderer;

    /**
     * Render the provided scene using this shared renderer
     *
     * @param canvas Canvas to render to
     * @param ctx The 2D rendering context for the canvas
     * @param width The width to render
     * @param height The height to render
     * @param scene The scene to render
     * @param camera The camera to render the scene from
     */
    renderScene(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        scene: Object3D,
        camera: Camera,
    ): void;
}

/**
 * Creates a new shared renderer
 *
 * @param pixelRatio Pixel ratio of the renderer
 * @returns The shared renderer
 */
export function createSharedRenderer(pixelRatio: number): SharedRenderer {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(pixelRatio);

    return {
        renderer,
        renderScene(
            canvas: HTMLCanvasElement,
            ctx: CanvasRenderingContext2D,
            width: number,
            height: number,
            scene: Object3D,
            camera: Camera,
        ) {
            // Update the size to match the current canvas
            renderer.setSize(width, height, false);

            // Render the scene
            renderer.render(scene, camera);

            // Copy framebuffer to this canvas
            canvas.width = width * pixelRatio;
            canvas.height = height * pixelRatio;
            ctx.drawImage(renderer.domElement, 0, 0);
        },
    };
}
