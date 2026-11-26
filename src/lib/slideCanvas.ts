import type {
  LanguageCode,
  PresentationFormat,
  Slide,
} from '../types/presentation';
import { LANGUAGE_META, resolveSlideFont } from '../data/themes';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(8, 22, 41, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export async function renderSlideToDataURL(params: {
  slide: Slide;
  language: LanguageCode;
  format: PresentationFormat;
  totalSlides: number;
  churchAuthor?: string;
  includeFooter?: boolean;
  scale?: number;
  backgroundOnly?: boolean;
}): Promise<string> {
  const {
    slide,
    language,
    format,
    totalSlides,
    churchAuthor,
    includeFooter = true,
    scale = 1,
    backgroundOnly = false,
  } = params;

  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready;
  }

  const baseW = format === '16:9' ? 1280 : 1200;
  const baseH = format === '16:9' ? 720 : 900;
  const outputScale = scale * 1.5; // 1920x1080 at scale=1 for 16:9!

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(baseW * outputScale);
  canvas.height = Math.round(baseH * outputScale);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas context for slide export.');
  }

  ctx.scale(outputScale, outputScale);

  const { design, background } = slide;
  const content = slide.content[language];
  const fontStack = resolveSlideFont(design.fontFamily, language);
  const bodyFontStack =
    language === 'ta'
      ? '"Noto Sans Tamil", "Plus Jakarta Sans", sans-serif'
      : language === 'si'
      ? '"Noto Sans Sinhala", "Plus Jakarta Sans", sans-serif'
      : '"Plus Jakarta Sans", "Inter", sans-serif';

  // 1. Solid base background
  ctx.fillStyle = design.backgroundColor || '#081629';
  ctx.fillRect(0, 0, baseW, baseH);

  // 2. Background photograph with object-cover positioning
  const img = await loadImage(background.imageUrl);
  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = baseW / baseH;
    let drawW = baseW;
    let drawH = baseH;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawH = baseH;
      drawW = baseH * imgRatio;
      offsetX =
        design.imagePosition === 'left'
          ? 0
          : design.imagePosition === 'right'
          ? baseW - drawW
          : (baseW - drawW) / 2;
    } else {
      drawW = baseW;
      drawH = baseW / imgRatio;
      offsetY =
        design.imagePosition === 'top'
          ? 0
          : design.imagePosition === 'bottom'
          ? baseH - drawH
          : (baseH - drawH) / 2;
    }

    if (design.layout === 'split-showcase') {
      // Draw full image softly then bright showcase on the right 42%
      ctx.save();
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    }
  }

  // 3. Measured cinematic overlay scrim
  const opacity = Math.min(Math.max(design.overlayOpacity, 0.15), 0.92);
  const isLightScrim = design.overlayGradient === 'light-sanctuary';
  const scrimHex = isLightScrim ? '#F8F5EE' : design.backgroundColor || '#081629';

  if (design.layout === 'split-showcase') {
    const grad = ctx.createLinearGradient(0, 0, baseW, 0);
    grad.addColorStop(0, hexToRgba(scrimHex, Math.min(opacity + 0.25, 0.96)));
    grad.addColorStop(0.58, hexToRgba(scrimHex, Math.min(opacity + 0.18, 0.93)));
    grad.addColorStop(0.76, hexToRgba(scrimHex, Math.max(opacity - 0.25, 0.2)));
    grad.addColorStop(1, hexToRgba(scrimHex, 0.12));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, baseW, baseH);
  } else if (design.overlayGradient === 'left-dark') {
    const grad = ctx.createLinearGradient(0, 0, baseW, 0);
    grad.addColorStop(0, hexToRgba(scrimHex, Math.min(opacity + 0.22, 0.95)));
    grad.addColorStop(0.55, hexToRgba(scrimHex, opacity));
    grad.addColorStop(1, hexToRgba(scrimHex, Math.max(opacity - 0.3, 0.18)));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, baseW, baseH);
  } else if (design.overlayGradient === 'bottom-dark') {
    const grad = ctx.createLinearGradient(0, 0, 0, baseH);
    grad.addColorStop(0, hexToRgba(scrimHex, Math.max(opacity - 0.2, 0.25)));
    grad.addColorStop(0.45, hexToRgba(scrimHex, opacity));
    grad.addColorStop(1, hexToRgba(scrimHex, Math.min(opacity + 0.24, 0.96)));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, baseW, baseH);
  } else if (design.overlayGradient === 'radial-vignette') {
    const grad = ctx.createRadialGradient(
      baseW / 2,
      baseH / 2,
      baseH * 0.12,
      baseW / 2,
      baseH / 2,
      baseW * 0.65
    );
    grad.addColorStop(0, hexToRgba(scrimHex, Math.max(opacity - 0.06, 0.42)));
    grad.addColorStop(1, hexToRgba(scrimHex, Math.min(opacity + 0.24, 0.96)));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, baseW, baseH);
  } else {
    ctx.fillStyle = hexToRgba(scrimHex, opacity);
    ctx.fillRect(0, 0, baseW, baseH);
  }

  // 4. Subtle royal gold architectural frame border
  const frameInset = 24;
  ctx.strokeStyle = hexToRgba(design.accentColor || '#D4AF67', 0.32);
  ctx.lineWidth = 1.25;
  ctx.strokeRect(frameInset, frameInset, baseW - frameInset * 2, baseH - frameInset * 2);

  if (backgroundOnly) {
    return canvas.toDataURL('image/jpeg', 0.94);
  }

  // 5. Text & Content rendering
  const padX = 76;
  const padTop = 68;
  const isCentered =
    design.alignment === 'center' ||
    design.layout === 'centered-proclamation' ||
    design.layout === 'prayer-sanctuary';
  const isRight = design.alignment === 'right' && !isCentered;

  const contentMaxW =
    design.layout === 'split-showcase'
      ? baseW * 0.56
      : design.layout === 'prayer-sanctuary'
      ? baseW - 220
      : design.layout === 'two-column-scripture'
      ? baseW - padX * 2
      : baseW * 0.72;

  const anchorX = isCentered ? baseW / 2 : isRight ? baseW - padX : padX;
  ctx.textAlign = isCentered ? 'center' : isRight ? 'right' : 'left';
  ctx.textBaseline = 'top';

  let cursorY = padTop;

  // Slide index & kicker
  if (content.kicker) {
    ctx.fillStyle = design.accentColor || '#D4AF67';
    ctx.font = `600 15px ${bodyFontStack}`;
    ctx.fillText(content.kicker, anchorX, cursorY);
    cursorY += 32;
  }

  // Main Title
  const titleSize = design.titleSize || 46;
  ctx.fillStyle = design.textColor || '#FFFFFF';
  ctx.font = `700 ${titleSize}px ${fontStack}`;
  const titleLines = wrapTextLines(ctx, content.title, contentMaxW);
  for (const line of titleLines) {
    ctx.fillText(line, anchorX, cursorY);
    cursorY += Math.round(titleSize * 1.22);
  }

  // Gold editorial hairline divider
  cursorY += 8;
  const ruleW = 84;
  const ruleX = isCentered ? baseW / 2 - ruleW / 2 : isRight ? baseW - padX - ruleW : padX;
  ctx.fillStyle = design.accentColor || '#D4AF67';
  ctx.fillRect(ruleX, cursorY, ruleW, 2.5);
  cursorY += 20;

  // Subtitle
  if (content.subtitle) {
    ctx.fillStyle = hexToRgba(design.textColor || '#FFFFFF', 0.82);
    ctx.font = `500 ${Math.max(17, Math.round((design.bodySize || 22) * 0.88))}px ${bodyFontStack}`;
    const subLines = wrapTextLines(ctx, content.subtitle, contentMaxW);
    for (const line of subLines) {
      ctx.fillText(line, anchorX, cursorY);
      cursorY += 28;
    }
    cursorY += 18;
  } else {
    cursorY += 12;
  }

  // Prayer body OR structured scripture points
  const bodySize = design.bodySize || 22;
  const refSize = design.refSize || 16;
  const spacingGap =
    design.spacing === 'compact' ? 14 : design.spacing === 'spacious' ? 28 : 20;

  if (slide.isPrayerSlide && content.prayerText) {
    const boxX = 110;
    const boxW = baseW - 220;
    const boxH = baseH - cursorY - 82;
    ctx.fillStyle = isLightScrim
      ? 'rgba(255, 255, 255, 0.78)'
      : 'rgba(8, 22, 41, 0.56)';
    ctx.strokeStyle = hexToRgba(design.accentColor || '#D4AF67', 0.42);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(boxX, cursorY, boxW, Math.max(boxH, 240), 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = design.textColor || '#FFFFFF';
    ctx.font = `500 ${Math.min(bodySize, 22)}px ${bodyFontStack}`;
    ctx.textAlign = 'center';
    const prayerLines = wrapTextLines(ctx, content.prayerText, boxW - 88);
    let pY = cursorY + 34;
    const lineH = Math.round(Math.min(bodySize, 22) * 1.56);
    for (const line of prayerLines) {
      if (pY > baseH - 104) break;
      if (line === '') {
        pY += Math.round(lineH * 0.55);
      } else {
        ctx.fillText(line, baseW / 2, pY);
        pY += lineH;
      }
    }
  } else if (content.points.length > 0) {
    const useTwoCols =
      design.layout === 'two-column-scripture' && content.points.length >= 4;

    if (useTwoCols) {
      const colGap = 36;
      const colW = (baseW - padX * 2 - colGap) / 2;
      const mid = Math.ceil(content.points.length / 2);
      const startY = cursorY;

      content.points.forEach((pt, idx) => {
        const colIdx = idx < mid ? 0 : 1;
        const rowIdx = idx < mid ? idx : idx - mid;
        const x = padX + colIdx * (colW + colGap);
        const rowH = design.spacing === 'compact' ? 68 : 78;
        const y = startY + rowIdx * (rowH + 12);

        if (y + rowH > baseH - 72) return;

        ctx.fillStyle = isLightScrim
          ? 'rgba(255, 255, 255, 0.72)'
          : 'rgba(16, 36, 60, 0.58)';
        ctx.strokeStyle = hexToRgba(design.accentColor || '#D4AF67', 0.28);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, colW, rowH, 10);
        ctx.fill();
        ctx.stroke();

        // Number + Point label
        ctx.textAlign = 'left';
        ctx.fillStyle = design.accentColor || '#D4AF67';
        ctx.font = `600 14px "JetBrains Mono", monospace`;
        ctx.fillText(String(idx + 1).padStart(2, '0'), x + 18, y + 18);

        ctx.fillStyle = design.textColor || '#FFFFFF';
        ctx.font = `600 ${Math.min(bodySize, 21)}px ${bodyFontStack}`;
        ctx.fillText(pt.label, x + 52, y + 15, colW - 70);

        if (design.showReferences && pt.reference) {
          ctx.fillStyle = design.accentColor || '#D4AF67';
          ctx.font = `500 ${Math.min(refSize, 15)}px ${bodyFontStack}`;
          ctx.fillText(pt.reference, x + 52, y + 44, colW - 70);
        }
      });
    } else {
      for (let i = 0; i < content.points.length; i++) {
        const pt = content.points[i];
        if (cursorY > baseH - 90) break;

        ctx.textAlign = isCentered ? 'center' : isRight ? 'right' : 'left';
        const numPrefix = `${String(i + 1).padStart(2, '0')}. `;

        ctx.fillStyle = design.textColor || '#FFFFFF';
        ctx.font = `600 ${bodySize}px ${bodyFontStack}`;

        const labelText =
          design.showReferences && pt.reference && design.referenceStyle === 'inline'
            ? `${numPrefix}${pt.label}  —  ${pt.reference}`
            : `${numPrefix}${pt.label}`;

        const lines = wrapTextLines(ctx, labelText, contentMaxW);
        for (const line of lines) {
          ctx.fillText(line, anchorX, cursorY);
          cursorY += Math.round(bodySize * 1.32);
        }

        if (design.showReferences && pt.reference && design.referenceStyle !== 'inline') {
          ctx.fillStyle = design.accentColor || '#D4AF67';
          ctx.font = `500 ${refSize}px ${bodyFontStack}`;
          ctx.fillText(pt.reference, anchorX, cursorY + 2);
          cursorY += Math.round(refSize * 1.45);
        }

        if (pt.scriptureNote) {
          ctx.fillStyle = hexToRgba(design.textColor || '#FFFFFF', 0.72);
          ctx.font = `400 ${Math.max(14, refSize - 1)}px ${bodyFontStack}`;
          const noteLines = wrapTextLines(ctx, pt.scriptureNote, contentMaxW);
          for (const nl of noteLines.slice(0, 2)) {
            ctx.fillText(nl, anchorX, cursorY + 2);
            cursorY += Math.round(refSize * 1.3);
          }
        }

        cursorY += spacingGap;
      }
    }
  }

  // 6. Footer (Church/Author & Slide Counter)
  if (includeFooter) {
    const footerY = baseH - 52;
    ctx.strokeStyle = hexToRgba(design.accentColor || '#D4AF67', 0.24);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, footerY - 12);
    ctx.lineTo(baseW - padX, footerY - 12);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = hexToRgba(design.textColor || '#FFFFFF', 0.65);
    ctx.font = `500 13px ${bodyFontStack}`;
    const leftFooter = [content.footerLabel, churchAuthor].filter(Boolean).join('  ·  ');
    if (leftFooter) {
      ctx.fillText(leftFooter, padX, footerY);
    }

    if (design.showSlideNumber) {
      const langMeta = LANGUAGE_META[language];
      ctx.textAlign = 'right';
      ctx.fillStyle = design.accentColor || '#D4AF67';
      ctx.font = `600 13px "JetBrains Mono", monospace`;
      ctx.fillText(
        `${langMeta.slideWord} ${String(slide.order).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`,
        baseW - padX,
        footerY
      );
    }
  }

  return canvas.toDataURL('image/png', 1.0);
}
