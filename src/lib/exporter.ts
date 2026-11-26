import PptxGenJS from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import type {
  LanguageCode,
  PresentationProject,
  Slide,
  StudioSettings,
} from '../types/presentation';
import { LANGUAGE_META } from '../data/themes';
import { renderSlideToDataURL } from './slideCanvas';

export interface ExportProgress {
  current: number;
  total: number;
  label: string;
}

function slugifyFileName(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9\u0B80-\u0BFF\u0D80-\u0DFF]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'way-of-salvation'
  );
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] ?? 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function cleanHex(color: string, fallback = 'FFFFFF'): string {
  const clean = color.replace('#', '').trim();
  return /^[0-9A-Fa-f]{6}$/.test(clean) ? clean.toUpperCase() : fallback;
}

function getPptxFont(language: LanguageCode, chosenFont: string): string {
  if (language === 'ta') return 'Noto Sans Tamil';
  if (language === 'si') return 'Noto Sans Sinhala';
  return chosenFont || 'Plus Jakarta Sans';
}

export async function exportSingleSlidePNG(params: {
  project: PresentationProject;
  slide: Slide;
  language: LanguageCode;
  settings: StudioSettings;
}): Promise<string> {
  const { project, slide, language, settings } = params;
  const dataUrl = await renderSlideToDataURL({
    slide,
    language,
    format: project.format,
    totalSlides: project.slides.length,
    churchAuthor: settings.includeChurchFooter ? project.author : undefined,
    includeFooter: settings.includeChurchFooter,
    scale: settings.pngScale,
  });

  const fileName = `${slugifyFileName(project.title)}-slide-${String(slide.order).padStart(2, '0')}-${language}.png`;
  triggerDownload(dataUrlToBlob(dataUrl), fileName);
  return fileName;
}

export async function exportProjectPPTX(params: {
  project: PresentationProject;
  language: LanguageCode;
  settings: StudioSettings;
  onProgress?: (progress: ExportProgress) => void;
}): Promise<string> {
  const { project, language, settings, onProgress } = params;
  const orderedSlides = [...project.slides].sort((a, b) => a.order - b.order);

  const pptx = new PptxGenJS();
  pptx.layout = project.format === '16:9' ? 'LAYOUT_WIDE' : 'LAYOUT_4x3';
  pptx.author = project.author || 'THE WAY OF SALVATION Studio';
  pptx.title = `${project.title} (${LANGUAGE_META[language].englishName})`;
  pptx.subject = project.subtitle;

  const slideW = project.format === '16:9' ? 13.333 : 10;
  const slideH = 7.5;

  for (let i = 0; i < orderedSlides.length; i++) {
    const slide = orderedSlides[i];
    const content = slide.content[language];
    const { design } = slide;

    onProgress?.({
      current: i + 1,
      total: orderedSlides.length,
      label: `Building PPTX Slide ${String(slide.order).padStart(2, '0')} (${LANGUAGE_META[language].englishName})`,
    });

    const pSlide = pptx.addSlide();
    pSlide.background = { color: cleanHex(design.backgroundColor, '081629') };

    if (settings.pptxMode === 'visual') {
      // Full high-resolution rendered slide image (guarantees identical Tamil/Sinhala shaping on every projector PC)
      const fullImg = await renderSlideToDataURL({
        slide,
        language,
        format: project.format,
        totalSlides: orderedSlides.length,
        churchAuthor: settings.includeChurchFooter ? project.author : undefined,
        includeFooter: settings.includeChurchFooter,
        scale: settings.pngScale,
      });
      pSlide.addImage({ data: fullImg, x: 0, y: 0, w: slideW, h: slideH });
    } else {
      // Editable native PowerPoint text layers over the scrimmed high-res Biblical background
      const bgImg = await renderSlideToDataURL({
        slide,
        language,
        format: project.format,
        totalSlides: orderedSlides.length,
        backgroundOnly: true,
        scale: 1,
      });
      pSlide.addImage({ data: bgImg, x: 0, y: 0, w: slideW, h: slideH });

      const fontFace = getPptxFont(language, design.fontFamily);
      const textHex = cleanHex(design.textColor, 'FFFFFF');
      const accentHex = cleanHex(design.accentColor, 'D4AF67');
      const align: 'left' | 'center' | 'right' =
        design.layout === 'prayer-sanctuary' || design.layout === 'centered-proclamation'
          ? 'center'
          : design.alignment;

      // Kicker
      if (content.kicker) {
        pSlide.addText(content.kicker, {
          x: 0.75,
          y: 0.55,
          w: slideW - 1.5,
          h: 0.38,
          fontFace,
          fontSize: 12,
          bold: true,
          color: accentHex,
          align,
        });
      }

      // Title
      pSlide.addText(content.title || `Slide ${slide.order}`, {
        x: 0.75,
        y: 0.95,
        w: slideW - 1.5,
        h: 0.9,
        fontFace,
        fontSize: Math.max(24, Math.round(design.titleSize * 0.68)),
        bold: true,
        color: textHex,
        align,
      });

      // Gold accent line
      pSlide.addShape(pptx.ShapeType.rect, {
        x: align === 'center' ? slideW / 2 - 0.6 : align === 'right' ? slideW - 1.95 : 0.75,
        y: 1.92,
        w: 1.2,
        h: 0.04,
        fill: { color: accentHex },
        line: { color: accentHex, width: 0 },
      });

      // Subtitle
      if (content.subtitle) {
        pSlide.addText(content.subtitle, {
          x: 0.75,
          y: 2.08,
          w: slideW - 1.5,
          h: 0.45,
          fontFace,
          fontSize: 15,
          color: textHex,
          align,
        });
      }

      // Prayer or Bullet Scripture Points
      if (slide.isPrayerSlide && content.prayerText) {
        pSlide.addText(content.prayerText, {
          x: 1.0,
          y: 2.75,
          w: slideW - 2.0,
          h: 3.85,
          fontFace,
          fontSize: 16,
          color: textHex,
          align: 'center',
          valign: 'middle',
          lineSpacingMultiple: 1.35,
          fill: { color: cleanHex(design.backgroundColor, '081629'), transparency: 42 },
          line: { color: accentHex, width: 1 },
          margin: 18,
        });
      } else if (content.points.length > 0) {
        const useTwoCols = design.layout === 'two-column-scripture' && content.points.length >= 4;
        if (useTwoCols) {
          const mid = Math.ceil(content.points.length / 2);
          const colW = (slideW - 2.0) / 2;
          const leftPoints = content.points.slice(0, mid);
          const rightPoints = content.points.slice(mid);

          const buildRuns = (pts: typeof content.points, offset: number) =>
            pts.flatMap((pt, idx) => {
              const runs: Array<{ text: string; options: Record<string, unknown> }> = [
                {
                  text: `${String(idx + offset + 1).padStart(2, '0')}. ${pt.label}`,
                  options: {
                    fontFace,
                    fontSize: 16,
                    bold: true,
                    color: textHex,
                    breakLine: Boolean(design.showReferences && pt.reference) ? false : true,
                  },
                },
              ];
              if (design.showReferences && pt.reference) {
                runs.push({
                  text: `  (${pt.reference})`,
                  options: {
                    fontFace,
                    fontSize: 13,
                    color: accentHex,
                    breakLine: true,
                  },
                });
              }
              return runs;
            });

          pSlide.addText(buildRuns(leftPoints, 0), {
            x: 0.75,
            y: 2.75,
            w: colW,
            h: 3.8,
            valign: 'top',
            paraSpaceAfter: 12,
          });
          pSlide.addText(buildRuns(rightPoints, mid), {
            x: 0.75 + colW + 0.5,
            y: 2.75,
            w: colW,
            h: 3.8,
            valign: 'top',
            paraSpaceAfter: 12,
          });
        } else {
          const runs = content.points.flatMap((pt, idx) => {
            const list: Array<{ text: string; options: Record<string, unknown> }> = [
              {
                text: `${String(idx + 1).padStart(2, '0')}. ${pt.label}`,
                options: {
                  fontFace,
                  fontSize: Math.max(16, Math.round(design.bodySize * 0.8)),
                  bold: true,
                  color: textHex,
                  breakLine: !(design.showReferences && pt.reference),
                },
              },
            ];
            if (design.showReferences && pt.reference) {
              list.push({
                text: `   —   ${pt.reference}`,
                options: {
                  fontFace,
                  fontSize: Math.max(13, Math.round(design.refSize * 0.86)),
                  color: accentHex,
                  breakLine: true,
                },
              });
            }
            return list;
          });

          pSlide.addText(runs, {
            x: 0.75,
            y: 2.75,
            w: design.layout === 'split-showcase' ? slideW * 0.58 : slideW - 1.5,
            h: 3.85,
            valign: 'top',
            align,
            paraSpaceAfter: 14,
          });
        }
      }

      // Footer
      if (settings.includeChurchFooter) {
        const footerLeft = [content.footerLabel, project.author].filter(Boolean).join('  ·  ');
        pSlide.addText(footerLeft, {
          x: 0.75,
          y: slideH - 0.55,
          w: slideW * 0.6,
          h: 0.35,
          fontFace,
          fontSize: 10,
          color: textHex,
        });
        if (design.showSlideNumber) {
          pSlide.addText(
            `${LANGUAGE_META[language].slideWord} ${String(slide.order).padStart(2, '0')} / ${String(orderedSlides.length).padStart(2, '0')}`,
            {
              x: slideW - 2.75,
              y: slideH - 0.55,
              w: 2.0,
              h: 0.35,
              fontFace,
              fontSize: 10,
              bold: true,
              color: accentHex,
              align: 'right',
            }
          );
        }
      }
    }
  }

  const fileName = `${slugifyFileName(project.title)}-${language}.pptx`;
  const output = (await pptx.write({ outputType: 'blob' })) as Blob;
  triggerDownload(output, fileName);
  return fileName;
}

export async function exportProjectPDF(params: {
  project: PresentationProject;
  language: LanguageCode;
  settings: StudioSettings;
  onProgress?: (progress: ExportProgress) => void;
}): Promise<string> {
  const { project, language, settings, onProgress } = params;
  const orderedSlides = [...project.slides].sort((a, b) => a.order - b.order);

  const pageW = project.format === '16:9' ? 338.67 : 254;
  const pageH = 190.5;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [pageW, pageH],
    compress: true,
  });

  for (let i = 0; i < orderedSlides.length; i++) {
    const slide = orderedSlides[i];
    onProgress?.({
      current: i + 1,
      total: orderedSlides.length,
      label: `Rendering PDF Slide ${String(slide.order).padStart(2, '0')} (${LANGUAGE_META[language].englishName})`,
    });

    const dataUrl = await renderSlideToDataURL({
      slide,
      language,
      format: project.format,
      totalSlides: orderedSlides.length,
      churchAuthor: settings.includeChurchFooter ? project.author : undefined,
      includeFooter: settings.includeChurchFooter,
      scale: settings.pngScale,
    });

    if (i > 0) doc.addPage([pageW, pageH], 'landscape');
    doc.addImage(dataUrl, 'PNG', 0, 0, pageW, pageH, undefined, 'FAST');
  }

  const fileName = `${slugifyFileName(project.title)}-${language}.pdf`;
  doc.save(fileName);
  return fileName;
}

export async function exportProjectZIP(params: {
  project: PresentationProject;
  languages: LanguageCode[];
  settings: StudioSettings;
  onProgress?: (progress: ExportProgress) => void;
}): Promise<string> {
  const { project, languages, settings, onProgress } = params;
  const orderedSlides = [...project.slides].sort((a, b) => a.order - b.order);
  const zip = new JSZip();

  const totalSteps = orderedSlides.length * languages.length;
  let step = 0;

  for (const lang of languages) {
    const folder =
      languages.length > 1
        ? zip.folder(`${LANGUAGE_META[lang].englishName}-${lang}`)
        : zip;

    for (const slide of orderedSlides) {
      step += 1;
      onProgress?.({
        current: step,
        total: totalSteps,
        label: `Exporting ${LANGUAGE_META[lang].englishName} Slide ${String(slide.order).padStart(2, '0')}`,
      });

      const dataUrl = await renderSlideToDataURL({
        slide,
        language: lang,
        format: project.format,
        totalSlides: orderedSlides.length,
        churchAuthor: settings.includeChurchFooter ? project.author : undefined,
        includeFooter: settings.includeChurchFooter,
        scale: settings.pngScale,
      });

      const base64Data = dataUrl.split(',')[1];
      folder?.file(
        `Slide-${String(slide.order).padStart(2, '0')}-${lang}.png`,
        base64Data,
        { base64: true }
      );
    }
  }

  const suffix = languages.length > 1 ? 'all-languages' : languages[0];
  const fileName = `${slugifyFileName(project.title)}-${suffix}-slides.zip`;
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, fileName);
  return fileName;
}
