<script lang="ts">
    import { onMount } from "svelte";
    import {
        BoxGeometry,
        Color,
        DataTexture,
        DirectionalLight,
        DoubleSide,
        Group,
        HemisphereLight,
        Mesh,
        MeshBasicMaterial,
        MeshStandardMaterial,
        NearestFilter,
        PerspectiveCamera,
        PlaneGeometry,
        RGBAFormat,
        Scene,
        UnsignedByteType,
    } from "three";
    import { watch } from "runed";
    import { rendererContext } from "$lib/context/rendererContext.svelte";
    import type { FaceRenderControls } from "$lib/render/faceRenderControls";
    import faceRenderControls from "$lib/render/faceRenderControls";

    type Props = {
        pixels: [number, number, number][];
        disableControls?: boolean;
    };

    interface FaceTexture {
        texture: DataTexture;
        data: Uint8Array;
    }

    const { pixels, disableControls }: Props = $props();

    const FACE_PANEL_WIDTH = 64;
    const FACE_PANEL_HEIGHT = 32;
    const MAX_CAMERA_ANGLE = 0.5;

    const renderer = rendererContext.get();

    let canvas: HTMLCanvasElement | undefined;
    let container: HTMLDivElement | undefined;
    let needsTextureUpdate = false;

    const faceCanvases: FaceTexture[] = [
        createFaceTexture(),
        createFaceTexture(),
    ];

    // Only mark for update when frame changes, don't do the heavy work here
    watch(
        () => pixels,
        () => {
            needsTextureUpdate = true;
        },
    );

    function createCamera(container: HTMLDivElement) {
        const { clientWidth, clientHeight } = container;
        const camera = new PerspectiveCamera(
            50,
            clientWidth / clientHeight,
            0.1,
            100,
        );
        camera.position.set(0, 0.5, 2);
        return camera;
    }

    function createScene() {
        const scene = new Scene();
        scene.background = new Color(0x0b0f12);
        return scene;
    }

    function createWorldLighting(scene: Scene) {
        const hemisphere = new HemisphereLight(0xffffff, 0x111122, 0.6);
        scene.add(hemisphere);

        const directional = new DirectionalLight(0xffffff, 0.8);
        directional.position.set(5, 5, 5);
        scene.add(directional);
    }

    function createGround(scene: Scene) {
        const groundMat = new MeshStandardMaterial({
            color: 0x08090a,
            roughness: 0.9,
        });
        const ground = new Mesh(new PlaneGeometry(10, 10), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1.0;
        scene.add(ground);
    }

    function createFaceTexture(): FaceTexture {
        const size = FACE_PANEL_WIDTH * FACE_PANEL_HEIGHT * 4;
        const data = new Uint8Array(size);

        const texture = new DataTexture(
            data,
            FACE_PANEL_WIDTH,
            FACE_PANEL_HEIGHT,
            RGBAFormat,
            UnsignedByteType,
        );
        texture.magFilter = NearestFilter;
        texture.minFilter = NearestFilter;
        texture.needsUpdate = true;
        texture.flipY = true;

        return { texture, data };
    }

    function updateTextures() {
        const totalWidth = faceCanvases.length * FACE_PANEL_WIDTH;

        for (let i = 0; i < faceCanvases.length; i += 1) {
            const { texture, data } = faceCanvases[i];

            let p = 0;
            for (let y = 0; y < FACE_PANEL_HEIGHT; y++) {
                for (let x = 0; x < FACE_PANEL_WIDTH; x++) {
                    const idx = y * totalWidth + (x + i * FACE_PANEL_WIDTH);
                    const pixel = pixels[idx];

                    if (pixel) {
                        const [r, g, b] = pixel;
                        data[p++] = r;
                        data[p++] = g;
                        data[p++] = b;
                        data[p++] = 255;
                    } else {
                        data[p++] = 0;
                        data[p++] = 0;
                        data[p++] = 0;
                        data[p++] = 255;
                    }
                }
            }

            texture.needsUpdate = true;
        }
    }

    function createHelmet(faceCanvases: FaceTexture[]): Group {
        const trimMat = new MeshStandardMaterial({
            color: 0x9fb8c8,
            metalness: 0.9,
            roughness: 0.2,
        });

        const root = new Group();
        const panelWidth = FACE_PANEL_WIDTH * 0.01;
        const panelHeight = FACE_PANEL_HEIGHT * 0.01;
        const gap = 0.2;

        for (let i = 0; i < faceCanvases.length; i++) {
            const faceCanvas = faceCanvases[i];

            const side = i === 0 ? -1 : 1;

            const plane = new PlaneGeometry(panelWidth, panelHeight);
            plane.translate(0, 0, 0.02);

            const material = new MeshBasicMaterial({
                map: faceCanvas.texture,
                side: DoubleSide,
            });
            const mesh = new Mesh(plane, material);
            mesh.position.set(side * gap, 0.5, 0.65);
            mesh.rotation.y = side * 1;
            mesh.rotation.x = 0.45;
            mesh.rotation.z = 0;

            const bezel = new BoxGeometry(
                panelWidth + 0.04,
                panelHeight + 0.04,
                0.02,
            );
            const bezelMesh = new Mesh(bezel, trimMat);
            bezelMesh.position.copy(mesh.position);
            bezelMesh.rotation.copy(mesh.rotation);
            bezelMesh.position.z -= 0.005;

            root.add(mesh);
            root.add(bezelMesh);
        }

        return root;
    }

    onMount(() => {
        if (!container || !canvas) return;
        const ctx = canvas.getContext("2d")!;

        const camera = createCamera(container);

        let controls: FaceRenderControls | undefined;
        if (!disableControls) {
            controls = faceRenderControls({
                canvas,
                maxCameraAngle: MAX_CAMERA_ANGLE,
                getCameraX() {
                    return camera.position.x;
                },
            });
        }

        const scene = createScene();
        createWorldLighting(scene);
        createGround(scene);

        const helmet = createHelmet(faceCanvases);
        scene.add(helmet);

        container.appendChild(renderer.domElement);

        let animationId: number | undefined;

        const animate = () => {
            animationId = requestAnimationFrame(animate);

            if (!container || !canvas) return;

            const { width, height } =
                canvas.parentElement!.getBoundingClientRect();

            const pixelRatio = renderer.getPixelRatio();

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            let shouldAutoAnimate = true;
            if (controls) {
                // Resume auto animation 2 seconds after last interaction
                const timeSinceInteraction =
                    Date.now() - controls.lastInteractionTime;
                shouldAutoAnimate = timeSinceInteraction > 2000;
            }

            let angle = 0;

            if (shouldAutoAnimate) {
                // Slowly move camera left and right in an arc
                const time = Date.now() * 0.0005;
                angle = Math.sin(time) * MAX_CAMERA_ANGLE;
                const radius = 1.5;
                camera.position.x = Math.sin(angle) * radius;
                camera.position.z = Math.cos(angle) * radius;

                // Rotate the helmet to face the camera
                helmet.rotation.y = -angle;
            } else if (controls) {
                // Use user-controlled position
                camera.position.x = controls.userCameraX;
                camera.position.z = 1.5;

                // Calculate angle from user position
                angle = Math.atan2(controls.userCameraX, 1.5);
                helmet.rotation.y = -angle;
            }

            // Adjust look-at target to center the visible panel
            const targetX = Math.sin(helmet.rotation.y) * 1.5;
            camera.lookAt(targetX, 0.5, 0);

            // Only update textures if needed, inside the animation loop
            if (needsTextureUpdate) {
                updateTextures();
                needsTextureUpdate = false;
            }

            renderer.setSize(width, height, false);
            renderer.render(scene, camera);

            // Copy framebuffer to this canvas
            canvas.width = width * pixelRatio;
            canvas.height = height * pixelRatio;
            ctx.drawImage(renderer.domElement, 0, 0);
        };

        animate();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            controls?.cleanup();
        };
    });
</script>

<div class="view">
    <div bind:this={container} class="container">
        <canvas bind:this={canvas}></canvas>
    </div>
</div>

<style>
    .view {
        display: flex;
        flex-flow: column;
        gap: 1rem;
        width: 100%;
        height: 100%;
    }

    .container {
        width: 100%;
        height: 100%;
        position: relative;
        border-radius: 8px;
        overflow: hidden;
    }
</style>
