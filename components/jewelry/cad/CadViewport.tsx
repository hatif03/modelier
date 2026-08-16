"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { TessellatedAssembly, TessellatedPart } from "@/lib/jewelry/cad/protocol";

export type CadViewportHandle = { captureSnapshot: () => string };

const METAL_COLOR: Record<string, number> = { yellow: 0xd4af37, white: 0xe8e4da, rose: 0xb76e79 };

function partToGeometry(part: TessellatedPart): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(part.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(part.normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(part.indices, 1));
  return geometry;
}

// Plain imperative Three.js — matching this codebase's existing imperative-canvas
// style (lib/canvas.ts's fabric setup), not introducing @react-three/fiber for one
// viewport. `preserveDrawingBuffer: true` is required for captureSnapshot()'s
// `toDataURL()` to return real pixels — otherwise the WebGL buffer is cleared before
// JS can read it.
const CadViewport = forwardRef<CadViewportHandle, { assembly: TessellatedAssembly | null; metalColor?: string }>(
  ({ assembly, metalColor = "yellow" }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<{
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
      controls: OrbitControls;
      group: THREE.Group;
    } | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);

      const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
      camera.position.set(25, 20, 25);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0, 0);
      controls.enableDamping = true;

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(20, 30, 20);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.4);
      fill.position.set(-20, 10, -10);
      scene.add(fill);

      const group = new THREE.Group();
      scene.add(group);

      sceneRef.current = { scene, camera, renderer, controls, group };

      let frameId = 0;
      const tick = () => {
        controls.update();
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(tick);
      };
      tick();

      const resize = () => {
        if (!canvas.parentElement) return;
        const width = canvas.parentElement.clientWidth;
        const height = canvas.parentElement.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();
      const observer = new ResizeObserver(resize);
      if (canvas.parentElement) observer.observe(canvas.parentElement);

      return () => {
        cancelAnimationFrame(frameId);
        observer.disconnect();
        controls.dispose();
        renderer.dispose();
        sceneRef.current = null;
      };
    }, []);

    useEffect(() => {
      const ctx = sceneRef.current;
      if (!ctx) return;

      while (ctx.group.children.length > 0) {
        const child = ctx.group.children[0] as THREE.Mesh;
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
        ctx.group.remove(child);
      }

      if (!assembly) return;

      for (const part of assembly.parts) {
        const geometry = partToGeometry(part);
        const material =
          part.material === "gemstone"
            ? new THREE.MeshPhysicalMaterial({ color: 0xbfe9ff, roughness: 0.05, metalness: 0, transmission: 0.9, ior: 2.4, thickness: 2 })
            : new THREE.MeshStandardMaterial({ color: METAL_COLOR[metalColor] ?? METAL_COLOR.yellow, roughness: 0.25, metalness: 0.9 });
        ctx.group.add(new THREE.Mesh(geometry, material));
      }

      // Reframe on every geometry change — a fixed camera position only ever
      // looked right for ring-sized parts; a 450mm necklace chain is more than
      // 10x that span and rendered almost entirely outside the fixed framing.
      const box = new THREE.Box3().setFromObject(ctx.group);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z, 1) / 2;
        const distance = radius / Math.sin((ctx.camera.fov * Math.PI) / 360) * 1.4;
        const direction = new THREE.Vector3(1, 0.8, 1).normalize();
        ctx.camera.position.copy(center).addScaledVector(direction, distance);
        ctx.camera.near = Math.max(distance / 100, 0.01);
        ctx.camera.far = distance * 100;
        ctx.camera.updateProjectionMatrix();
        ctx.controls.target.copy(center);
        ctx.controls.update();
      }
    }, [assembly, metalColor]);

    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        const ctx = sceneRef.current;
        if (!ctx) return "";
        ctx.renderer.render(ctx.scene, ctx.camera);
        return ctx.renderer.domElement.toDataURL("image/png");
      },
    }));

    return <canvas ref={canvasRef} className="h-full w-full" />;
  }
);

CadViewport.displayName = "CadViewport";

export default CadViewport;
