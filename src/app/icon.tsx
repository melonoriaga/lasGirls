import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = {
  width: 256,
  height: 256,
};

export const contentType = "image/png";

export default async function Icon() {
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
          alt="Las Girls+ favicon"
          width={256}
          height={256}
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
