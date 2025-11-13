<script lang="ts">
    import { onMount } from "svelte";
    import {
        BoxGeometry,
        CanvasTexture,
        Color,
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
        Scene,
        WebGLRenderer,
    } from "three";
    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
    import type { FaceFrame } from "$lib/types/data";

    type Props = {
        frame: FaceFrame;
    };

    interface FaceCanvas {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        texture: CanvasTexture<HTMLCanvasElement>;
        mesh?: Mesh;
    }

    const { frame }: Props = $props();

    const FACE_PANEL_WIDTH = 64;
    const FACE_PANEL_HEIGHT = 32;
    const LED_SCALE = 6;

    let container: HTMLDivElement | undefined;
    let facesContainer: HTMLDivElement | undefined;

    const faceCanvases: FaceCanvas[] = [createFaceCanvas(), createFaceCanvas()];

    $effect(() => {
        const totalWidth = faceCanvases.length * FACE_PANEL_WIDTH;

        for (let i = 0; i < faceCanvases.length; i += 1) {
            const faceCanvas = faceCanvases[i];

            for (let y = 0; y < FACE_PANEL_HEIGHT; y++) {
                for (let x = 0; x < FACE_PANEL_WIDTH; x++) {
                    const xOffset = i * FACE_PANEL_WIDTH;

                    const idx = y * totalWidth + (x + xOffset);
                    const [r, g, b] = frame.pixels[idx];

                    const ctx = faceCanvas.ctx;

                    ctx.fillStyle = `rgb(${r},${g},${b})`;

                    ctx.shadowColor = `rgb(${r},${g},${b})`;
                    ctx.shadowBlur = 3;

                    ctx.beginPath();
                    ctx.arc(
                        x * LED_SCALE + LED_SCALE / 2,
                        y * LED_SCALE + LED_SCALE / 2,
                        LED_SCALE / 2 - 1,
                        0,
                        Math.PI * 2,
                    );
                    ctx.fill();
                }
            }
        }
    });

    function createCamera(container: HTMLDivElement) {
        const { clientWidth, clientHeight } = container;
        const camera = new PerspectiveCamera(
            50,
            clientWidth / clientHeight,
            0.1,
            100,
        );
        camera.position.set(0, 0, 2);
        return camera;
    }

    function createRenderer(container: HTMLDivElement) {
        const { clientWidth, clientHeight } = container;
        const renderer = new WebGLRenderer({ antialias: true });
        renderer.setSize(clientWidth, clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        return renderer;
    }

    function createControls(
        camera: PerspectiveCamera,
        renderer: WebGLRenderer,
    ) {
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0.05, 0);
        controls.update();
        return controls;
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

    function createFaceCanvas(): FaceCanvas {
        const canvas = document.createElement("canvas");
        canvas.width = FACE_PANEL_WIDTH * LED_SCALE;
        canvas.height = FACE_PANEL_HEIGHT * LED_SCALE;

        canvas.style.width = `${FACE_PANEL_WIDTH * LED_SCALE}px`;
        canvas.style.height = `${FACE_PANEL_HEIGHT * LED_SCALE}px`;
        // canvas.style.imageRendering = "pixelated";

        const ctx = canvas.getContext("2d");
        if (ctx === null) throw new Error("missing canvas 2d context");

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new CanvasTexture(canvas);
        texture.minFilter = NearestFilter;
        texture.magFilter = NearestFilter;
        texture.generateMipmaps = false;
        return { canvas, ctx, texture };
    }

    function createHelmet(faceCanvases: FaceCanvas[]): Group {
        const trimMat = new MeshStandardMaterial({
            color: 0x9fb8c8,
            metalness: 0.9,
            roughness: 0.2,
        });

        const root = new Group();
        const panelWidth = FACE_PANEL_WIDTH * 0.01;
        const panelHeight = FACE_PANEL_HEIGHT * 0.01;

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
            mesh.position.set(side * 0.28, 0.5, 0.65);
            mesh.rotation.y = side * 1;
            mesh.rotation.x = 0.45;
            mesh.rotation.z = 0;

            // Attach the mesh to the canvas
            faceCanvas.mesh = mesh;

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
        if (!container) return;

        const camera = createCamera(container);
        const renderer = createRenderer(container);
        const controls = createControls(camera, renderer);
        const scene = createScene();
        createWorldLighting(scene);
        createGround(scene);

        const helmet = createHelmet(faceCanvases);
        scene.add(helmet);

        container.appendChild(renderer.domElement);

        let animationId: number | undefined;

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        const onWindowResize = () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        // Add event listeners
        window.addEventListener("resize", onWindowResize);

        animate();

        for (const face of faceCanvases) {
            facesContainer?.appendChild(face.canvas);
        }

        return () => {
            //  Cancel pending animation frames
            if (animationId) cancelAnimationFrame(animationId);

            // Remove event listeners
            window.removeEventListener("resize", onWindowResize);
            renderer.dispose();

            for (const face of faceCanvases) {
                facesContainer?.removeChild(face.canvas);
            }
        };
    });
</script>

<div class="view">
    <div bind:this={container} class="container"></div>
    <div bind:this={facesContainer} class="faces-container"></div>
</div>

<style>
    .view {
        display: flex;
        flex-flow: column;
        gap: 1rem;
    }

    .container {
        width: 100%;
        height: 300px;
        position: relative;
        border-radius: 8px;
        overflow: hidden;
    }

    .faces-container {
        display: flex;
        gap: 1rem;
    }
</style>
