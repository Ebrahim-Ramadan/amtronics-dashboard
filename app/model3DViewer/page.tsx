"use client";
import { useSearchParams } from "next/navigation";
import React, { useRef, useEffect, useState } from "react";

let THREE: typeof import("three") | null = null;

function ThreeJSViewer({ url }: { url: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let renderer: any, scene: any, camera: any, controls: any, model: any, loader: any;
    let cleanup = () => {};

    async function load() {
      if (!mountRef.current) return;
      setLoading(true);
      THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls");

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0xf0f4f8); // Soft background color
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      mountRef.current.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        60,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 1, 3);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.autoRotate = false;

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 1));
      const light = new THREE.DirectionalLight(0xffffff, 0.7);
      light.position.set(5, 10, 7.5);
      scene.add(light);

      // Mouse interaction: highlight on hover
      let raycaster = new THREE.Raycaster();
      let mouse = new THREE.Vector2();
      let INTERSECTED: any = null;

      function onPointerMove(event: MouseEvent) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      }
      renderer.domElement.addEventListener("pointermove", onPointerMove);

      // Detect file type
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.endsWith(".gltf") || lowerUrl.endsWith(".glb")) {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader");
        loader = new GLTFLoader();
        loader.load(
          url,
          (gltf: any) => {
            model = gltf.scene;
            scene.add(model);
            setLoading(false);
          },
          undefined,
          (error: any) => {
            setLoading(false);
            console.error("Error loading GLTF model:", error);
          }
        );
      } else if (lowerUrl.endsWith(".obj")) {
        const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader");
        loader = new OBJLoader();
        loader.load(
          url,
          (obj: any) => {
            model = obj;
            // Give a default color if no material
            model.traverse((child: any) => {
              if (child.isMesh && !child.material) {
                child.material = new THREE.MeshStandardMaterial({ color: 0x2196f3 });
              }
            });
            scene.add(model);
            setLoading(false);
          },
          undefined,
          (error: any) => {
            setLoading(false);
            console.error("Error loading OBJ model:", error);
          }
        );
      } else {
        // Not supported
        const div = document.createElement("div");
        div.innerText = "Unsupported 3D model format. Only .glb, .gltf, .obj are supported.";
        div.style.color = "red";
        mountRef.current.appendChild(div);
        setLoading(false);
        return;
      }

      function animate() {
        requestAnimationFrame(animate);
        controls.update();

        // Mouse hover highlight
        if (model) {
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(model.children, true);
          if (intersects.length > 0) {
            if (INTERSECTED !== intersects[0].object) {
              if (INTERSECTED && INTERSECTED.material && INTERSECTED.material.emissive) {
                INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
              }
              INTERSECTED = intersects[0].object;
              if (INTERSECTED.material && INTERSECTED.material.emissive) {
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                INTERSECTED.material.emissive.setHex(0xff9800); // Highlight color
              }
            }
          } else {
            if (INTERSECTED && INTERSECTED.material && INTERSECTED.material.emissive) {
              INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
            }
            INTERSECTED = null;
          }
        }

        renderer.render(scene, camera);
      }
      animate();

      cleanup = () => {
        renderer.dispose();
        renderer.domElement.removeEventListener("pointermove", onPointerMove);
        if (mountRef.current) {
          mountRef.current.innerHTML = "";
        }
      };
    }

    load();

    return () => {
      cleanup();
    };
  }, [url]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative"
      style={{ width: "100%", height: "100%" }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
          <span className="animate-spin rounded-full border-4 border-blue-400 border-t-transparent h-10 w-10 mr-2"></span>
          <span className="text-blue-700 font-semibold">Loading 3D Model...</span>
        </div>
      )}
    </div>
  );
}

export default function Model3DViewerPage() {
  const searchParams = useSearchParams();
  const modelUrl = searchParams.get("modelurl");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h1 className="text-xl font-bold mb-4">3D Model Viewer</h1>
      {!modelUrl ? (
        <div className="text-red-500">No 3D model URL provided.</div>
      ) : (
        <div className="w-full max-w-xl h-[500px] border rounded bg-gray-100 flex items-center justify-center">
          <ThreeJSViewer url={modelUrl} />
        </div>
      )}
    </div>
  );
}