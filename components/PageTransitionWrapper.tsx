'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

interface WireframeCubeProps {
  cubeSize: number;
  borderColor: string;
  targetRotation: { x: number[]; y: number[]; z: number[] };
  duration: number;
}

/**
 * Single 6-faced 3D Wireframe Cube rotating about the shared central origin (0,0,0).
 */
function WireframeCube3D({
  cubeSize,
  borderColor,
  targetRotation,
  duration,
}: WireframeCubeProps) {
  const half = cubeSize / 2;

  const faces: Array<{ name: string; transform: string }> = [
    { name: 'front', transform: `rotateY(0deg) translateZ(${half}px)` },
    { name: 'back', transform: `rotateY(180deg) translateZ(${half}px)` },
    { name: 'right', transform: `rotateY(90deg) translateZ(${half}px)` },
    { name: 'left', transform: `rotateY(-90deg) translateZ(${half}px)` },
    { name: 'top', transform: `rotateX(90deg) translateZ(${half}px)` },
    { name: 'bottom', transform: `rotateX(-90deg) translateZ(${half}px)` },
  ];

  return (
    <motion.div
      animate={{
        rotateX: targetRotation.x,
        rotateY: targetRotation.y,
        rotateZ: targetRotation.z,
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="absolute"
      style={{
        width: cubeSize,
        height: cubeSize,
        transformStyle: 'preserve-3d',
      }}
    >
      {faces.map((face) => (
        <div
          key={face.name}
          className="absolute inset-0"
          style={{
            transform: face.transform,
            border: `1.5px solid ${borderColor}`,
            backgroundColor: 'rgba(29, 78, 216, 0.02)',
            backfaceVisibility: 'visible',
          }}
        />
      ))}
    </motion.div>
  );
}

/**
 * 2 Overlapping Deep Royal Blue 3D Wireframe Cubes with a Small Sphere at the Centre
 * Reduced to 1/3 size (45px stage, ~29px cubes, ~9px central sphere), spinning about one fixed spot.
 */
export function Wireframe3DIcon({ size = 45 }: { size?: number }) {
  const cubeSize1 = Math.round(size * 0.64); // 29px (1/3 of 87px)
  const cubeSize2 = Math.round(size * 0.64); // 29px (1/3 of 87px)
  const sphereSize = Math.max(8, Math.round(size * 0.2)); // 9px (1/3 of 26px)

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        width: size,
        height: size,
        perspective: '450px',
      }}
      aria-label="Loading page"
      role="status"
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Cube 1: Deep Royal Blue (#0F2D6B) */}
        <WireframeCube3D
          cubeSize={cubeSize1}
          borderColor="#0F2D6B"
          targetRotation={{
            x: [0, 360],
            y: [0, 360],
            z: [0, 180],
          }}
          duration={3.2}
        />

        {/* Cube 2: Deep Royal Blue (#1D4ED8) overlapping Cube 1 at 45deg counter-axis */}
        <WireframeCube3D
          cubeSize={cubeSize2}
          borderColor="#1D4ED8"
          targetRotation={{
            x: [45, -315],
            y: [45, 405],
            z: [45, -315],
          }}
          duration={2.8}
        />

        {/* Small Deep Royal Blue Sphere Fixed at the Exact Centre (0, 0, 0) */}
        <motion.div
          animate={{
            rotateY: [0, 360],
            rotateX: [0, -360],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="relative flex items-center justify-center"
          style={{
            width: sphereSize,
            height: sphereSize,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Solid Deep Royal Blue Shaded Core Sphere */}
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                'radial-gradient(circle at 32% 32%, #3B82F6 0%, #1D4ED8 48%, #0F2D6B 90%, #0B2545 100%)',
              boxShadow: '0 0 6px rgba(29, 78, 216, 0.45)',
            }}
          />
          {/* Orbital 3D Wireframe Rings Around the Central Sphere */}
          <div
            className="absolute inset-[-1.5px] rounded-full border border-[#0F2D6B]"
            style={{ transform: 'rotateY(60deg)' }}
          />
          <div
            className="absolute inset-[-1.5px] rounded-full border border-[#1D4ED8]"
            style={{ transform: 'rotateX(60deg)' }}
          />
        </motion.div>
      </div>
    </div>
  );
}

const PAGE_SWITCH_DELAY_MS = 1000;

export default function PageTransitionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const triggerOneSecondTransition = () => {
    setIsTransitioning(true);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      timerRef.current = null;
    }, PAGE_SWITCH_DELAY_MS);
  };

  // Trigger 1-second blank white page with centered 3D spinning royal blue dual-cube wireframe on route changes
  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      triggerOneSecondTransition();
    }, 0);

    return () => {
      window.clearTimeout(startTimer);
    };
  }, [pathname]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Show the 1-second blank white 3D dual-cube loading screen immediately when any internal page link is clicked
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank'
      ) {
        return;
      }
      const cleanPath = href.split('?')[0].split('#')[0];
      if (cleanPath && cleanPath !== pathname) {
        triggerOneSecondTransition();
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [pathname]);

  return (
    <>
      {/* Full-Screen Blank White Loading Page with Centered 3D Overlapping Royal Blue 2 Cubes & Sphere (1-Second Hold) */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="blank-white-3d-cube-loader"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center"
          >
            <Wireframe3DIcon size={45} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smooth Animated Page Entrance */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </>
  );
}
