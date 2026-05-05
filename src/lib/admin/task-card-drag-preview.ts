import type { DragEvent } from "react";

/**
 * Imagen de arrastre personalizada: muestra una copia “levantada” de la card junto al cursor.
 * El nodo clonado debe existir en el documento en el momento del setDragImage; se elimina en el siguiente frame.
 */
export function attachTaskCardDragPreview(ev: DragEvent<HTMLElement>): void {
  const el = ev.currentTarget;
  const rect = el.getBoundingClientRect();
  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("draggable");
  clone.querySelectorAll("[draggable]").forEach((node) => node.removeAttribute("draggable"));
  /* Quitar capa “clic en toda la card” para que el preview muestre título y chips. */
  clone.querySelectorAll("a").forEach((node) => {
    if (node instanceof HTMLElement && node.classList.contains("absolute")) node.remove();
  });
  clone.style.boxSizing = "border-box";
  clone.style.width = `${rect.width}px`;
  clone.style.maxWidth = `${rect.width}px`;
  clone.style.position = "fixed";
  clone.style.top = "-10000px";
  clone.style.left = "0";
  clone.style.zIndex = "100000";
  clone.style.opacity = "0.97";
  clone.style.pointerEvents = "none";
  clone.style.borderRadius = "16px";
  clone.style.boxShadow = "0 28px 56px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,133,162,0.35)";
  clone.style.transform = "rotate(2deg)";
  clone.style.backgroundColor = "#ffffff";
  document.body.appendChild(clone);
  const offsetX = Math.min(Math.max(ev.clientX - rect.left, 0), rect.width);
  const offsetY = Math.min(Math.max(ev.clientY - rect.top, 0), rect.height);
  ev.dataTransfer.setDragImage(clone, offsetX, offsetY);
  // No lo removemos inmediatamente: algunos navegadores/frames lo necesitan para pintar.
  window.setTimeout(() => {
    clone.remove();
  }, 900);
}
