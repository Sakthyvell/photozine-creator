import { degrees, PDFDocument, rgb } from 'pdf-lib';
import type { BookletSheet, BookletSheetSide } from '../../lib/booklet';
import type { PreviewAsset } from '../preview';
import type { QuarterTurn, ZinePage } from '../../types';

const a4LandscapeWidth = 841.89;
const a4LandscapeHeight = 595.28;
const a5PageWidth = a4LandscapeWidth / 2;
const a5PageHeight = a4LandscapeHeight;

type EmbeddedImage = Awaited<ReturnType<PDFDocument['embedPng']>>;

export type ExportAssetMap = Record<string, PreviewAsset>;

function fitContainBox(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const sourceAspectRatio = sourceWidth / sourceHeight;
  const targetAspectRatio = targetWidth / targetHeight;

  if (sourceAspectRatio > targetAspectRatio) {
    const width = targetWidth;
    const height = width / sourceAspectRatio;
    return { width, height };
  }

  const height = targetHeight;
  const width = height * sourceAspectRatio;
  return { width, height };
}

async function embedAsset(
  pdfDocument: PDFDocument,
  asset: PreviewAsset,
  cache: Map<string, EmbeddedImage>,
) {
  const cachedImage = cache.get(asset.id);
  if (cachedImage) {
    return cachedImage;
  }

  const bytes = await asset.file.arrayBuffer();
  const embeddedImage =
    asset.format === 'image/png'
      ? await pdfDocument.embedPng(bytes)
      : await pdfDocument.embedJpg(bytes);

  cache.set(asset.id, embeddedImage);
  return embeddedImage;
}

function drawRotatedImage(
  pdfPage: ReturnType<PDFDocument['addPage']>,
  image: EmbeddedImage,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
  rotationQuarterTurns: QuarterTurn,
) {
  const normalizedRotation = rotationQuarterTurns % 4;
  const rotatedWidth = normalizedRotation % 2 === 0 ? image.width : image.height;
  const rotatedHeight = normalizedRotation % 2 === 0 ? image.height : image.width;
  const fittedBox = fitContainBox(rotatedWidth, rotatedHeight, boxWidth, boxHeight);
  const centeredX = boxX + (boxWidth - fittedBox.width) / 2;
  const centeredY = boxY + (boxHeight - fittedBox.height) / 2;

  if (normalizedRotation === 0) {
    pdfPage.drawImage(image, {
      x: centeredX,
      y: centeredY,
      width: fittedBox.width,
      height: fittedBox.height,
    });
    return;
  }

  if (normalizedRotation === 2) {
    pdfPage.drawImage(image, {
      x: centeredX + fittedBox.width,
      y: centeredY + fittedBox.height,
      width: fittedBox.width,
      height: fittedBox.height,
      rotate: degrees(180),
    });
    return;
  }

  if (normalizedRotation === 1) {
    pdfPage.drawImage(image, {
      x: centeredX + fittedBox.width,
      y: centeredY,
      width: fittedBox.height,
      height: fittedBox.width,
      rotate: degrees(90),
    });
    return;
  }

  pdfPage.drawImage(image, {
    x: centeredX,
    y: centeredY + fittedBox.height,
    width: fittedBox.height,
    height: fittedBox.width,
    rotate: degrees(270),
  });
}

async function drawReadingPageSide(
  pdfDocument: PDFDocument,
  pdfPage: ReturnType<PDFDocument['addPage']>,
  zinePage: ZinePage,
  assetMap: ExportAssetMap,
  imageCache: Map<string, EmbeddedImage>,
  originX: number,
) {
  pdfPage.drawRectangle({
    x: originX,
    y: 0,
    width: a5PageWidth,
    height: a5PageHeight,
    color: rgb(1, 1, 1),
  });

  for (const frame of zinePage.frames) {
    if (!frame.assetId) {
      continue;
    }

    const asset = assetMap[frame.assetId];
    if (!asset) {
      continue;
    }

    const image = await embedAsset(pdfDocument, asset, imageCache);
    const frameX = originX + frame.x * a5PageWidth;
    const frameY = a5PageHeight - (frame.y + frame.height) * a5PageHeight;
    const frameWidth = frame.width * a5PageWidth;
    const frameHeight = frame.height * a5PageHeight;

    drawRotatedImage(
      pdfPage,
      image,
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      frame.rotationQuarterTurns,
    );
  }
}

async function drawSheetSide(
  pdfDocument: PDFDocument,
  sheetSide: BookletSheetSide,
  assetMap: ExportAssetMap,
  imageCache: Map<string, EmbeddedImage>,
) {
  const pdfPage = pdfDocument.addPage([a4LandscapeWidth, a4LandscapeHeight]);

  await drawReadingPageSide(
    pdfDocument,
    pdfPage,
    sheetSide.leftPage,
    assetMap,
    imageCache,
    0,
  );

  await drawReadingPageSide(
    pdfDocument,
    pdfPage,
    sheetSide.rightPage,
    assetMap,
    imageCache,
    a5PageWidth,
  );
}

export async function generateBookletPdfBytes(
  sheets: readonly BookletSheet[],
  assetMap: ExportAssetMap,
) {
  const pdfDocument = await PDFDocument.create();
  const imageCache = new Map<string, EmbeddedImage>();

  for (const sheet of sheets) {
    await drawSheetSide(pdfDocument, sheet.front, assetMap, imageCache);
    await drawSheetSide(pdfDocument, sheet.back, assetMap, imageCache);
  }

  return pdfDocument.save();
}

export function downloadPdfBytes(bytes: Uint8Array, fileName: string) {
  const pdfBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(pdfBuffer).set(bytes);
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

export function buildExportFileName() {
  return 'photo-zine-booklet.pdf';
}
