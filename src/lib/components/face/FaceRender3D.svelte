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
    import { FACE_PANEL_HEIGHT, FACE_PANEL_WIDTH } from "$lib/constants";

    type Props = {
        pixels: [number, number, number][];
        disableControls?: boolean;
    };

    interface FaceTexture {
        texture: DataTexture;
        data: Uint8Array;
    }

    const { pixels, disableControls }: Props = $props();

    const MAX_CAMERA_ANGLE = 0.45;
    const PIXEL_TO_WORLD_SCALE = 0.01;
    const RADIUS = 1.5;

    const renderer = rendererContext.get();

    const faceCanvases: FaceTexture[] = [
        createFaceTexture(),
        createFaceTexture(),
    ];

    let canvas: HTMLCanvasElement | undefined;
    let container: HTMLDivElement | undefined;
    let needsTextureUpdate = false;

    // Only mark for update when frame changes, don't do the heavy work here
    watch(
        () => pixels,
        () => {
            needsTextureUpdate = true;
        },
    );

    function createCamera(width: number, height: number) {
        const camera = new PerspectiveCamera(50, width / height, 0.1, 100);
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
        const DEFAULT_PIXEL: [number, number, number] = [0, 0, 0];
        const totalWidth = faceCanvases.length * FACE_PANEL_WIDTH;

        for (let i = 0; i < faceCanvases.length; i += 1) {
            const { texture, data } = faceCanvases[i];

            let p = 0;
            for (let y = 0; y < FACE_PANEL_HEIGHT; y++) {
                for (let x = 0; x < FACE_PANEL_WIDTH; x++) {
                    const idx = y * totalWidth + (x + i * FACE_PANEL_WIDTH);
                    const [r, g, b] = pixels[idx] ?? DEFAULT_PIXEL;

                    data[p++] = r;
                    data[p++] = g;
                    data[p++] = b;
                    data[p++] = 255;
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
        const panelWidth = FACE_PANEL_WIDTH * PIXEL_TO_WORLD_SCALE;
        const panelHeight = FACE_PANEL_HEIGHT * PIXEL_TO_WORLD_SCALE;
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

        const localCanvas = canvas;
        const ctx = canvas.getContext("2d")!;
        const containerBounds = container.getBoundingClientRect();

        let width = containerBounds.width;
        let height = containerBounds.height;
        let animationId: number | undefined;

        const camera = createCamera(width, height);

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

        function updateCameraPosition() {
            if (controls) {
                const timeSinceInteraction =
                    Date.now() - controls.lastInteractionTime;

                // User controlled position is active
                if (timeSinceInteraction < 2000) {
                    camera.position.x = controls.userCameraX;
                    camera.position.z = RADIUS;

                    // Calculate angle from user position
                    const angle = Math.atan2(controls.userCameraX, RADIUS);
                    helmet.rotation.y = -angle;
                    return;
                }
            }

            // Slowly move camera left and right in an arc
            const time = Date.now() * 0.0005;
            const angle = Math.sin(time) * MAX_CAMERA_ANGLE;

            camera.position.x = Math.sin(angle) * RADIUS;
            camera.position.z = Math.cos(angle) * RADIUS;

            // Rotate the helmet to face the camera
            helmet.rotation.y = -angle;
        }

        function animate() {
            animationId = requestAnimationFrame(animate);

            // Update the camera position
            updateCameraPosition();

            // Adjust look-at target to center the visible panel
            const targetX = Math.sin(helmet.rotation.y) * RADIUS;
            camera.lookAt(targetX, 0.5, 0);

            // Update texture if needed
            if (needsTextureUpdate) {
                updateTextures();
                needsTextureUpdate = false;
            }

            renderer.renderScene(
                localCanvas,
                ctx,
                width,
                height,
                scene,
                camera,
            );
        }

        animate();

        function onResize() {
            if (!container) return;

            const containerBounds = container.getBoundingClientRect();

            // Update the stored size
            width = containerBounds.width;
            height = containerBounds.height;

            // Update the camera size and projection matrix
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }

        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            if (animationId) cancelAnimationFrame(animationId);
            controls?.cleanup();
        };
    });
</script>

<div bind:this={container} class="container">
    <canvas bind:this={canvas}></canvas>
</div>

<style>
    .container {
        width: 100%;
        height: 100%;
        position: relative;
        border-radius: 8px;
        overflow: hidden;
    }
</style>
