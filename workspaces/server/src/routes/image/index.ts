import { createReadStream } from 'node:fs';
import type { ReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Image } from 'image-js';
import { z } from 'zod';

import { IMAGES_PATH, IMAGES_SEED_CACHE_PATH, IMAGES_CACHE_PATH } from '../../constants/paths';
import type { ConverterInterface } from '../../image-converters/ConverterInterface';
import { avifConverter } from '../../image-converters/avifConverter';
import { jpegConverter } from '../../image-converters/jpegConverter';
// import { jpegXlConverter } from '../../image-converters/jpegXlConverter';
import { pngConverter } from '../../image-converters/pngConverter';
import { webpConverter } from '../../image-converters/webpConverter';

const createStreamBody = (stream: ReadStream) => {
  const body = new ReadableStream({
    cancel() {
      stream.destroy();
    },
    start(controller) {
      stream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      stream.on('end', () => {
        controller.close();
      });
    },
  });

  return body;
};

const SUPPORTED_IMAGE_EXTENSIONS = ['avif', 'webp', 'png', 'jpeg', 'jpg'] as const;

type SupportedImageExtension = (typeof SUPPORTED_IMAGE_EXTENSIONS)[number];

function isSupportedImageFormat(ext: unknown): ext is SupportedImageExtension {
  return (SUPPORTED_IMAGE_EXTENSIONS as readonly unknown[]).includes(ext);
}

const IMAGE_MIME_TYPE: Record<SupportedImageExtension, string> = {
  ['avif']: 'image/avif',
  ['jpeg']: 'image/jpeg',
  ['jpg']: 'image/jpeg',
  // ['jxl']: 'image/jxl',
  ['png']: 'image/png',
  ['webp']: 'image/webp',
};

const IMAGE_CONVERTER: Record<SupportedImageExtension, ConverterInterface> = {
  ['avif']: avifConverter,
  ['jpeg']: jpegConverter,
  ['jpg']: jpegConverter,
  // ['jxl']: jpegXlConverter,
  ['png']: pngConverter,
  ['webp']: webpConverter,
};

const app = new Hono();

const reqImageSizeToString = (regImageSize: {
    format?: string | undefined;
    height?: number | undefined;
    width?: number | undefined;
}) => {
  return `?${Object.entries(regImageSize).map(([key,val]) => `${key}=${val}`).join('&')}`
}

const findFiles = async (imagePath: string, reqImgId: string) => {
  try {
    const files = await fs.readdir(imagePath);  // ディレクトリ内のファイルを取得
    const filePattern = new RegExp(`^${reqImgId}(\\..*)?$`);  // ファイル名がIDに一致する正規表現
    const matchedFiles = files.filter(file => filePattern.test(file));

    // 絶対パスに変換
    const matchedPaths = matchedFiles.map(file => path.resolve(imagePath, file));

    console.log(matchedPaths);  // マッチしたファイルのパスを表示
    return matchedPaths;
  } catch (error) {
    console.error('Error:', error);
  }
}

app.get(
  '/images/:imageFile',
  zValidator(
    'param',
    z.object({
      imageFile: z.string().regex(/^[a-f0-9-]+(?:\.\w*)?$/),
    }),
  ),
  zValidator(
    'query',
    z.object({
      format: z.string().optional(),
      height: z.coerce.number().optional(),
      width: z.coerce.number().optional(),
    }),
  ),
  async (c) => {
    performance.mark('start')
    const startTime = performance.now();
    console.log('imageRequest', c.req.url)
    // c.header('Cross-Origin-Resource-Policy', 'cross-origin')

    const { ext: reqImgExt, name: reqImgId } = path.parse(c.req.valid('param').imageFile);
    
    const resImgFormat = c.req.valid('query').format ?? reqImgExt.slice(1);
    console.log('imageRequestCheck', isSupportedImageFormat(resImgFormat), resImgFormat)
    if (!isSupportedImageFormat(resImgFormat)) {
      throw new HTTPException(501, { message: `Image format: ${resImgFormat} is not supported.` });
    }
    performance.mark('resImgFormat:end')



    let origFilePath: string | undefined = undefined;

    const reqImageSize = c.req.valid('query');
    const cacheFilePath = path.join(IMAGES_CACHE_PATH, `${reqImgId}${reqImageSizeToString(reqImageSize)}.${resImgFormat}`)

    // 画像のresize等を既に行ったことあるファイルに関してはスキップする
    try {
      const cacheFileBinary = await fs.readFile(cacheFilePath);
      console.log('cached')
      const performanceMarks = performance.getEntriesByType('mark')
      for (let i = 1; i < performanceMarks.length; i++) {
        performance.measure(`${performanceMarks[i]?.name} - ${performanceMarks[i-1]?.name}`, performanceMarks[i-1]?.name ?? '', performanceMarks[i]?.name ?? '')
      }
      performance.getEntriesByType('measure').forEach((entry) => {
        console.log(`${entry.name}'s duration: ${entry.duration}`);
      });
      performance.clearMarks()
      performance.clearMeasures()
      c.header('Content-Type', IMAGE_MIME_TYPE[resImgFormat]);
      console.log('alltime', performance.now() - startTime);
      return c.body(cacheFileBinary);
    } catch (e) {
      // 初期読み込みは必ず失敗するのでエラーではない
      console.info('not:manipulated', e)
    }

    // 元の画像データからの探索
    const orginFilePaths = await findFiles(IMAGES_PATH, reqImgId) ?? []
    // 探索
    origFilePath = orginFilePaths.find(v => path.extname(v).slice(1) === resImgFormat) ?? orginFilePaths[0]

    performance.mark('findFiles:end')
    console.log({origFilePath})
    if (origFilePath === undefined) {
      throw new HTTPException(404, { message: 'Not found.' });
    }
    const origImgFormat = path.extname(origFilePath).slice(1);
    console.log('origFilePath:image', {origFilePath, cacheFilePath})

    if (!isSupportedImageFormat(origImgFormat)) {
      throw new HTTPException(500, { message: 'Failed to load image.' });
    }
    performance.mark('origImgFormat:end')
    if (resImgFormat === origImgFormat && c.req.valid('query').width == null && c.req.valid('query').height == null) {
      // 画像変換せずにそのまま返す
      console.log('画像返還せずに', c.req.valid('query'))
      c.header('Content-Type', IMAGE_MIME_TYPE[resImgFormat]);
      // c.header('Cross-Origin-Resource-Policy', 'cross-origin')
      return c.body(createStreamBody(createReadStream(origFilePath)));
    }

    c.header('Content-Type', IMAGE_MIME_TYPE[resImgFormat]);

    const origBinary = await fs.readFile(origFilePath);
    performance.mark('origBinary:end')
    const image = new Image(await IMAGE_CONVERTER[origImgFormat].decode(origBinary));
    performance.mark('new Image:end')

    const scale = Math.max((reqImageSize.width ?? 0) / image.width, (reqImageSize.height ?? 0) / image.height) || 1;
    const manipulated = image.resize({
      height: Math.ceil(image.height * scale),
      preserveAspectRatio: true,
      width: Math.ceil(image.width * scale),
    });
    console.log('checkImage', {height: Math.ceil(image.height * scale),
      preserveAspectRatio: true,
      width: Math.ceil(image.width * scale)})
    let resBinary: Uint8Array = new Uint8Array();
    try {
      resBinary = await IMAGE_CONVERTER[resImgFormat].encode({
      colorSpace: 'srgb',
      data: new Uint8ClampedArray(manipulated.data),
      height: manipulated.height,
      width: manipulated.width,
    }) ;
      }catch (e) {
      console.error('resbinary:e', e);
      }
      performance.mark('resBinary:end')
      console.log('alltime', performance.now() - startTime);
      const performanceMarks = performance.getEntriesByType('mark')

      for (let i = 1; i < performanceMarks.length; i++) {
        performance.measure(`${performanceMarks[i]?.name} - ${performanceMarks[i-1]?.name}`, performanceMarks[i-1]?.name ?? '', performanceMarks[i]?.name ?? '')
      }
      performance.getEntriesByType('measure').forEach((entry) => {
        console.log(`${entry.name}'s duration: ${entry.duration}`);
      });
      performance.clearMarks()
      performance.clearMeasures()

      // asyncで、加工後の画像を保存する
      fs.writeFile(cacheFilePath, resBinary)
      // 開発環境のみのコード
      const convertPath = cacheFilePath.replace(IMAGES_CACHE_PATH, IMAGES_SEED_CACHE_PATH)
      console.log('writeFilePath', convertPath, cacheFilePath)
      fs.writeFile(convertPath, resBinary)

      return c.body(resBinary);

  },
);

export { app as imageApp };
