import type { ConverterInterface } from './ConverterInterface';
import sharp from "sharp";

export const avifConverter: ConverterInterface = {
  async decode(data: Uint8Array): Promise<ImageData> {

    return sharp(data)
      .ensureAlpha()
      .raw()
      .toBuffer({
        resolveWithObject: true,
      })
      .then(({ data, info }) => {
        return {
          colorSpace: 'srgb',
          data: new Uint8ClampedArray(data),
          height: info.height,
          width: info.width,
        };
      });
  },
  async encode(data: ImageData): Promise<Uint8Array> {

    return sharp(data.data, {
      raw: {
        channels: 4,
        height: data.height,
        width: data.width,
      },
    })
      .avif({ effort: 9 })
      .toBuffer();
  },
};
