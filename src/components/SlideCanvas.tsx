import React, { useEffect, useRef, useState } from 'react';
import type {
  LanguageCode,
  PresentationFormat,
  Slide,
} from '../types/presentation';
import { LANGUAGE_META, resolveSlideFont } from '../data/themes';

interface SlideCanvasProps {
  slide: Slide;
  language: LanguageCode;
  format: PresentationFormat;
  totalSlides: number;
  churchAuthor?: string;
  includeFooter?: boolean;
  className?: string;
  interactive?: boolean;
  onTitleClick?: () => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(8, 22, 41, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getObjectPosition(pos: Slide['design']['imagePosition']): string {
  switch (pos) {
    case 'top':
      return '50% 10%';
    case 'bottom':
      return '50% 90%';
    case 'left':
      return '15% 50%';
    case 'right':
      return '85% 50%';
    default:
      return '50% 50%';
  }
}

export const SlideCanvas: React.FC<SlideCanvasProps> = ({
  slide,
  language,
  format,
  totalSlides,
  churchAuthor,
  includeFooter = true,
  className = '',
  interactive = false,
  onTitleClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.5);
  const [imageError, setImageError] = useState(false);

  const baseW = format === '16:9' ? 1280 : 1200;
  const baseH = format === '16:9' ? 720 : 900;

  useEffect(() => {
    setImageError(false);
  }, [slide.background.imageUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setScale(rect.width / baseW);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [baseW]);

  const { design, background } = slide;
  const content = slide.content[language];
  const langMeta = LANGUAGE_META[language];

  const isLightScrim = design.overlayGradient === 'light-sanctuary';
  const scrimBase = isLightScrim ? '#F8F5EE' : design.backgroundColor || '#081629';
  const opacity = Math.min(Math.max(design.overlayOpacity, 0.15), 0.92);

  let overlayBackground = hexToRgba(scrimBase, opacity);
  if (design.layout === 'split-showcase') {
    overlayBackground = `linear-gradient(90deg, ${hexToRgba(scrimBase, Math.min(opacity + 0.24, 0.96))} 0%, ${hexToRgba(scrimBase, Math.min(opacity + 0.16, 0.92))} 58%, ${hexToRgba(scrimBase, Math.max(opacity - 0.25, 0.2))} 78%, ${hexToRgba(scrimBase, 0.12)} 100%)`;
  } else if (design.overlayGradient === 'left-dark') {
    overlayBackground = `linear-gradient(90deg, ${hexToRgba(scrimBase, Math.min(opacity + 0.22, 0.95))} 0%, ${hexToRgba(scrimBase, opacity)} 55%, ${hexToRgba(scrimBase, Math.max(opacity - 0.3, 0.18))} 100%)`;
  } else if (design.overlayGradient === 'bottom-dark') {
    overlayBackground = `linear-gradient(180deg, ${hexToRgba(scrimBase, Math.max(opacity - 0.2, 0.25))} 0%, ${hexToRgba(scrimBase, opacity)} 45%, ${hexToRgba(scrimBase, Math.min(opacity + 0.24, 0.96))} 100%)`;
  } else if (design.overlayGradient === 'radial-vignette') {
    overlayBackground = `radial-gradient(circle at 50% 50%, ${hexToRgba(scrimBase, Math.max(opacity - 0.06, 0.42))} 12%, ${hexToRgba(scrimBase, Math.min(opacity + 0.24, 0.96))} 100%)`;
  }

  const isCentered =
    design.alignment === 'center' ||
    design.layout === 'centered-proclamation' ||
    design.layout === 'prayer-sanctuary';
  const isRight = design.alignment === 'right' && !isCentered;

  const titleFont = resolveSlideFont(design.fontFamily, language);
  const bodyFont =
    language === 'ta'
      ? '"Noto Sans Tamil", "Plus Jakarta Sans", sans-serif'
      : language === 'si'
      ? '"Noto Sans Sinhala", "Plus Jakarta Sans", sans-serif'
      : '"Plus Jakarta Sans", "Inter", sans-serif';

  const gapPx =
    design.spacing === 'compact' ? 12 : design.spacing === 'spacious' ? 26 : 18;

  const useTwoColumns =
    design.layout === 'two-column-scripture' && content.points.length >= 4;

  const contentWidthClass =
    design.layout === 'split-showcase'
      ? 'w-[58%]'
      : design.layout === 'two-column-scripture'
      ? 'w-full'
      : design.layout === 'prayer-sanctuary'
      ? 'w-[86%] mx-auto'
      : isCentered
      ? 'w-[82%] mx-auto'
      : 'w-[74%]';

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none ${
        format === '16:9' ? 'aspect-video' : 'aspect-[4/3]'
      } ${className}`}
      style={{ backgroundColor: design.backgroundColor || '#081629' }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left overflow-hidden"
        style={{
          width: `${baseW}px`,
          height: `${baseH}px`,
          transform: `scale(${scale})`,
          backgroundColor: design.backgroundColor || '#081629',
        }}
      >
        {/* Background Photography with Resilient Fallback */}
        {background.imageUrl && !imageError ? (
          <img
            src={background.imageUrl}
            alt={content.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: getObjectPosition(design.imagePosition) }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 75% 30%, ${hexToRgba(design.accentColor || '#D4AF67', 0.28)} 0%, ${design.backgroundColor || '#081629'} 68%)`,
            }}
          />
        )}

        {/* Measured Contrast Scrim */}
        <div className="absolute inset-0" style={{ background: overlayBackground }} />

        {/* Architectural Royal Gold Hairline Frame */}
        <div
          className="pointer-events-none absolute inset-6 border"
          style={{ borderColor: hexToRgba(design.accentColor || '#D4AF67', 0.32) }}
        />

        {/* Slide Content Stage */}
        <div
          className="relative z-10 flex h-full flex-col justify-between"
          style={{
            padding: '64px 76px 48px 76px',
            fontFamily: bodyFont,
            color: design.textColor || '#FFFFFF',
          }}
        >
          <div
            className={`flex flex-1 flex-col ${
              design.layout === 'prayer-sanctuary' ? 'justify-center' : 'justify-start'
            } ${contentWidthClass} ${
              isCentered ? 'items-center text-center' : isRight ? 'items-end text-right ml-auto' : 'items-start text-left'
            }`}
          >
            {/* Kicker */}
            {content.kicker && (
              <div
                className="mb-2.5 font-semibold tracking-wide"
                style={{
                  color: design.accentColor || '#D4AF67',
                  fontSize: '15px',
                }}
              >
                {content.kicker}
              </div>
            )}

            {/* Main Heading */}
            <h2
              onClick={interactive ? onTitleClick : undefined}
              className={`font-bold leading-[1.18] ${
                interactive ? 'cursor-pointer hover:opacity-90' : ''
              }`}
              style={{
                fontFamily: titleFont,
                fontSize: `${design.titleSize}px`,
                color: design.textColor || '#FFFFFF',
                textShadow: isLightScrim ? 'none' : '0 2px 18px rgba(0,0,0,0.45)',
              }}
            >
              {content.title}
            </h2>

            {/* Gold Editorial Divider */}
            <div
              className="my-4 h-[2.5px] w-20"
              style={{ backgroundColor: design.accentColor || '#D4AF67' }}
            />

            {/* Subtitle */}
            {content.subtitle && (
              <p
                className="mb-6 font-medium leading-snug"
                style={{
                  fontSize: `${Math.max(17, Math.round(design.bodySize * 0.88))}px`,
                  color: hexToRgba(design.textColor || '#FFFFFF', 0.84),
                }}
              >
                {content.subtitle}
              </p>
            )}

            {/* Acceptance Prayer Layout */}
            {slide.isPrayerSlide && content.prayerText ? (
              <div
                className="mt-1 w-full rounded-xl border px-10 py-8 text-center"
                style={{
                  backgroundColor: isLightScrim
                    ? 'rgba(255, 255, 255, 0.8)'
                    : 'rgba(8, 22, 41, 0.56)',
                  borderColor: hexToRgba(design.accentColor || '#D4AF67', 0.42),
                }}
              >
                <div
                  className="whitespace-pre-line font-medium leading-[1.65]"
                  style={{
                    fontSize: `${Math.min(design.bodySize, 21)}px`,
                    color: design.textColor || '#FFFFFF',
                  }}
                >
                  {content.prayerText}
                </div>
              </div>
            ) : useTwoColumns ? (
              /* Two-Column Scripture Grid for 5–7 items */
              <div className="mt-1 grid w-full grid-cols-2 gap-x-7 gap-y-3 text-left">
                {content.points.map((pt, idx) => (
                  <div
                    key={pt.id}
                    className="flex items-start gap-4 rounded-lg border px-5 py-3.5"
                    style={{
                      backgroundColor: isLightScrim
                        ? 'rgba(255, 255, 255, 0.72)'
                        : 'rgba(16, 36, 60, 0.58)',
                      borderColor: hexToRgba(design.accentColor || '#D4AF67', 0.28),
                    }}
                  >
                    <span
                      className="mt-1 font-mono text-sm font-semibold tabular-nums shrink-0"
                      style={{ color: design.accentColor || '#D4AF67' }}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-semibold leading-snug"
                        style={{
                          fontSize: `${Math.min(design.bodySize, 21)}px`,
                          color: design.textColor || '#FFFFFF',
                        }}
                      >
                        {pt.label}
                      </div>
                      {design.showReferences && pt.reference && (
                        <div
                          className="mt-1 font-medium"
                          style={{
                            fontSize: `${Math.min(design.refSize, 15)}px`,
                            color: design.accentColor || '#D4AF67',
                          }}
                        >
                          {pt.reference}
                        </div>
                      )}
                      {pt.scriptureNote && (
                        <div
                          className="mt-1 text-sm leading-snug"
                          style={{ color: hexToRgba(design.textColor || '#FFFFFF', 0.72) }}
                        >
                          {pt.scriptureNote}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Structured Editorial List */
              <div
                className={`mt-1 flex w-full flex-col ${
                  isCentered ? 'items-center' : isRight ? 'items-end' : 'items-start'
                }`}
                style={{ gap: `${gapPx}px` }}
              >
                {content.points.map((pt, idx) => (
                  <div
                    key={pt.id}
                    className={`flex flex-col ${
                      isCentered ? 'items-center' : isRight ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className="flex flex-wrap items-baseline gap-x-3 font-semibold leading-snug"
                      style={{
                        fontSize: `${design.bodySize}px`,
                        color: design.textColor || '#FFFFFF',
                      }}
                    >
                      <span
                        className="font-mono text-[0.72em] font-semibold tabular-nums"
                        style={{ color: design.accentColor || '#D4AF67' }}
                      >
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <span>{pt.label}</span>
                      {design.showReferences &&
                        pt.reference &&
                        design.referenceStyle === 'inline' && (
                          <span
                            className="font-medium"
                            style={{
                              fontSize: `${design.refSize}px`,
                              color: design.accentColor || '#D4AF67',
                            }}
                          >
                            — {pt.reference}
                          </span>
                        )}
                    </div>

                    {design.showReferences &&
                      pt.reference &&
                      design.referenceStyle !== 'inline' && (
                        <div
                          className={`mt-0.5 font-medium ${
                            design.referenceStyle === 'subtle-bar'
                              ? 'border-b pb-0.5'
                              : ''
                          }`}
                          style={{
                            fontSize: `${design.refSize}px`,
                            color: design.accentColor || '#D4AF67',
                            borderColor: hexToRgba(design.accentColor || '#D4AF67', 0.35),
                          }}
                        >
                          {pt.reference}
                        </div>
                      )}

                    {pt.scriptureNote && (
                      <div
                        className="mt-1 max-w-2xl leading-snug"
                        style={{
                          fontSize: `${Math.max(14, design.refSize - 1)}px`,
                          color: hexToRgba(design.textColor || '#FFFFFF', 0.76),
                        }}
                      >
                        {pt.scriptureNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Slide Footer */}
          {includeFooter && (
            <div
              className="mt-4 flex items-center justify-between border-t pt-3 text-[13px]"
              style={{
                borderColor: hexToRgba(design.accentColor || '#D4AF67', 0.25),
              }}
            >
              <div
                className="font-medium"
                style={{ color: hexToRgba(design.textColor || '#FFFFFF', 0.68) }}
              >
                {[content.footerLabel, churchAuthor].filter(Boolean).join('  ·  ')}
              </div>
              {design.showSlideNumber && (
                <div
                  className="font-mono font-semibold tabular-nums"
                  style={{ color: design.accentColor || '#D4AF67' }}
                >
                  {langMeta.slideWord} {String(slide.order).padStart(2, '0')} /{' '}
                  {String(totalSlides).padStart(2, '0')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
