"use client";

import { AnimatePresence, motion } from "motion/react";
import type { TargetAndTransition, Transition } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface RotatingTextProps {
  texts: string[];
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | number;
  transition?: Transition;
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  exit?: TargetAndTransition;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
  splitBy?: "characters" | "words" | "lines";
  loop?: boolean;
  auto?: boolean;
}

export function RotatingText({
  texts,
  rotationInterval = 2000,
  staggerDuration = 0.025,
  staggerFrom = "first",
  transition = { type: "spring", damping: 25, stiffness: 300 },
  initial = { y: "100%", opacity: 0 },
  animate = { y: 0, opacity: 1 },
  exit = { y: "-120%", opacity: 0 },
  mainClassName,
  splitLevelClassName,
  elementLevelClassName,
  splitBy = "characters",
  loop = true,
  auto = true,
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  const splitIntoCharacters = (word: string) => Array.from(word);

  const elements = useMemo(() => {
    const current = texts[index] ?? "";
    if (splitBy === "characters") {
      const words = current.split(" ");
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1,
      }));
    }
    if (splitBy === "words") {
      return current.split(" ").map((word, i, arr) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1,
      }));
    }
    return current.split("").map((ch) => ({ characters: [ch], needsSpace: false }));
  }, [index, splitBy, texts]);

  const getStaggerDelay = useCallback(
    (charIndex: number, total: number) => {
      if (staggerFrom === "first") return charIndex * staggerDuration;
      if (staggerFrom === "last") return (total - 1 - charIndex) * staggerDuration;
      if (staggerFrom === "center") {
        const center = Math.floor(total / 2);
        return Math.abs(center - charIndex) * staggerDuration;
      }
      if (typeof staggerFrom === "number") {
        return Math.abs(staggerFrom - charIndex) * staggerDuration;
      }
      return 0;
    },
    [staggerDuration, staggerFrom],
  );

  const next = useCallback(() => {
    setIndex((prev) => {
      const nextIdx = prev + 1;
      if (nextIdx >= texts.length) return loop ? 0 : prev;
      return nextIdx;
    });
  }, [loop, texts.length]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(next, rotationInterval);
    return () => clearInterval(id);
  }, [auto, next, rotationInterval]);

  const totalChars = elements.reduce((sum, el) => sum + el.characters.length, 0);
  let runningIndex = 0;

  return (
    <motion.span
      className={mainClassName}
      style={{ display: "inline-flex", flexWrap: "wrap", whiteSpace: "pre" }}
      layout
    >
      <span className="sr-only">{texts[index]}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          layout
          aria-hidden
          style={{ display: "inline-flex", flexWrap: "wrap", whiteSpace: "pre" }}
        >
          {elements.map((word, wordIdx) => (
            <span key={wordIdx} className={splitLevelClassName} style={{ display: "inline-flex" }}>
              {word.characters.map((char, charIdx) => {
                const currentCharIdx = runningIndex;
                runningIndex += 1;
                return (
                  <motion.span
                    key={charIdx}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(currentCharIdx, totalChars),
                    }}
                    className={elementLevelClassName}
                    style={{ display: "inline-block" }}
                  >
                    {char}
                  </motion.span>
                );
              })}
              {word.needsSpace && <span style={{ whiteSpace: "pre" }}> </span>}
            </span>
          ))}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

export default RotatingText;
