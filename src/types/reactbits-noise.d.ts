declare module "@appletosolutions/reactbits/dist/Noise" {
  import type { FC } from "react";

  export interface NoiseProps {
    patternSize?: number;
    patternScaleX?: number;
    patternScaleY?: number;
    patternRefreshInterval?: number;
    patternAlpha?: number;
  }

  const Noise: FC<NoiseProps>;
  export default Noise;
}
