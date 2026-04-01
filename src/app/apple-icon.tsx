import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
  const stickerPath = join(process.cwd(), "public", "brand", "stickers", "sticker-6.png");
  const stickerBuffer = await readFile(stickerPath);
  const stickerDataUrl = `data:image/png;base64,${stickerBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <img
          src={stickerDataUrl}
          alt="Las Girls+ apple icon"
          width={180}
          height={180}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    ),
    size,
  );
}
