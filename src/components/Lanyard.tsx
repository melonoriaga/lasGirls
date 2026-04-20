/* eslint-disable @typescript-eslint/no-explicit-any, react/no-unknown-property */
"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";

import "./Lanyard.css";

extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: any;
    meshLineMaterial: any;
  }
}

const CARD_GLB_URL = "/lanyard/card.glb";

// Fallback asset kept around so the `useTexture` call remains stable
// (otherwise the Suspense-based loader swaps hooks between renders).
const CARD_TEX_FALLBACK = "/brand/stickers/STICKER7.png";

type Vec3 = [number, number, number];

interface LanyardProps {
  position?: Vec3;
  gravity?: Vec3;
  fov?: number;
  transparent?: boolean;
  /** Optional direct texture URL for the card front. Overrides cardColor + cardStickerUrl. */
  cardTextureUrl?: string;
  /** Solid background color painted on the card front. */
  cardColor?: string;
  /** Sticker/logo overlaid on top of the card body (transparent PNG). */
  cardStickerUrl?: string;
  /** Solid color painted on the lanyard strap. */
  strapColor?: string;
  /** Sticker tiled over the strap. */
  strapStickerUrl?: string;
  /** Render the card horizontally. Default false (vertical, like the original). */
  landscape?: boolean;
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  cardTextureUrl,
  cardColor = "#ff3ea5",
  cardStickerUrl = "/brand/stickers/STICKER7.png",
  strapColor = "#ff6faf",
  strapStickerUrl = "/brand/stickers/STICKER9.png",
  landscape = false,
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent, antialias: true }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1);
          if (transparent) scene.background = null;
        }}
      >
        <ambientLight intensity={Math.PI} />
        <Suspense fallback={null}>
          <Physics
            interpolate
            gravity={gravity}
            timeStep={isMobile ? 1 / 30 : 1 / 60}
          >
            <Band
              isMobile={isMobile}
              cardTextureUrl={cardTextureUrl}
              cardColor={cardColor}
              cardStickerUrl={cardStickerUrl}
              strapColor={strapColor}
              strapStickerUrl={strapStickerUrl}
              landscape={landscape}
            />
          </Physics>
          <Environment blur={0.75}>
            <Lightformer
              intensity={2}
              color="white"
              position={[0, -1, 5]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[-1, -1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[1, 1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={10}
              color="white"
              position={[-10, 0, 14]}
              rotation={[0, Math.PI / 2, Math.PI / 3]}
              scale={[100, 10, 1]}
            />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}

interface BandProps {
  maxSpeed?: number;
  minSpeed?: number;
  isMobile?: boolean;
  cardTextureUrl?: string;
  cardColor: string;
  cardStickerUrl?: string;
  strapColor: string;
  strapStickerUrl?: string;
  landscape?: boolean;
}

/**
 * Paint a square canvas with a solid color, then stamp a sticker centered
 * on it. Returns a `THREE.CanvasTexture` ready to plug into a material.
 */
function buildCardCanvasTexture(color: string, stickerUrl?: string) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.flipY = false;
  texture.center.set(0.5, 0.5);

  if (stickerUrl) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const target = 720;
      const ar = img.width / img.height;
      let w = target;
      let h = target;
      if (ar > 1) h = target / ar;
      else w = target * ar;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      texture.needsUpdate = true;
    };
    img.src = stickerUrl;
  }
  return texture;
}

/**
 * Paint a long horizontal canvas to serve as a tileable band texture.
 * Draws the strap color as background and stamps the sticker once; the
 * MeshLineMaterial `repeat` setting multiplies that stamp along the strap.
 */
function buildStrapCanvasTexture(color: string, stickerUrl?: string) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 16;

  if (stickerUrl) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const target = canvas.height * 0.82;
      const ar = img.width / img.height;
      let w = target;
      let h = target;
      if (ar > 1) h = target / ar;
      else w = target * ar;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      texture.needsUpdate = true;
    };
    img.src = stickerUrl;
  }
  return texture;
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  cardTextureUrl,
  cardColor,
  cardStickerUrl,
  strapColor,
  strapStickerUrl,
  landscape = false,
}: BandProps) {
  const band = useRef<any>(null);
  const fixed = useRef<any>(null);
  const j1 = useRef<any>(null);
  const j2 = useRef<any>(null);
  const j3 = useRef<any>(null);
  const card = useRef<any>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps: any = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };

  const { nodes, materials } = useGLTF(CARD_GLB_URL) as any;

  // Keep this hook call stable (always with a string URL) to preserve
  // Suspense/hook ordering. When the caller does not provide their own
  // texture, we fall back to a lightweight asset but ignore the result.
  const customCardTexture = useTexture(cardTextureUrl || CARD_TEX_FALLBACK);

  useEffect(() => {
    if (!cardTextureUrl) return;
    customCardTexture.flipY = false;
    customCardTexture.colorSpace = THREE.SRGBColorSpace;
    customCardTexture.anisotropy = 16;
    customCardTexture.center.set(0.5, 0.5);
    customCardTexture.rotation = landscape ? -Math.PI / 2 : 0;
    customCardTexture.needsUpdate = true;
  }, [cardTextureUrl, customCardTexture, landscape]);

  const cardCanvasTexture = useMemo(
    () => buildCardCanvasTexture(cardColor, cardStickerUrl),
    [cardColor, cardStickerUrl],
  );
  const strapCanvasTexture = useMemo(
    () => buildStrapCanvasTexture(strapColor, strapStickerUrl),
    [strapColor, strapStickerUrl],
  );

  // Landscape mode: rotate the UVs of the procedural card texture so the
  // sticker appears upright when the card is rendered horizontally.
  useEffect(() => {
    if (!cardCanvasTexture) return;
    cardCanvasTexture.center.set(0.5, 0.5);
    cardCanvasTexture.rotation = landscape ? -Math.PI / 2 : 0;
    cardCanvasTexture.needsUpdate = true;
  }, [cardCanvasTexture, landscape]);

  useEffect(() => {
    return () => {
      cardCanvasTexture?.dispose();
      strapCanvasTexture?.dispose();
    };
  }, [cardCanvasTexture, strapCanvasTexture]);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
  );
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0],
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? "grabbing" : "grab";
      return () => void (document.body.style.cursor = "auto");
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      const d = dragged as THREE.Vector3;
      card.current?.setNextKinematicTranslation({
        x: vec.x - d.x,
        y: vec.y - d.y,
        z: vec.z - d.z,
      });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) {
          ref.current.lerped = new THREE.Vector3().copy(
            ref.current.translation(),
          );
        }
        const clampedDistance = Math.max(
          0.1,
          Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())),
        );
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)),
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      (band.current.geometry as any).setPoints(
        curve.getPoints(isMobile ? 16 : 32),
      );
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = "chordal";

  const effectiveCardMap = cardTextureUrl
    ? customCardTexture
    : cardCanvasTexture ?? materials.base.map;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => {
              e.target.releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e: any) => {
              e.target.setPointerCapture(e.pointerId);
              drag(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(vec.copy(card.current.translation())),
              );
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={effectiveCardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.85}
                metalness={0.15}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap={strapCanvasTexture ? 1 : 0}
          map={strapCanvasTexture ?? undefined}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(CARD_GLB_URL);
