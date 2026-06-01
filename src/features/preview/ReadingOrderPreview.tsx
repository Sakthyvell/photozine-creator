import type { CSSProperties } from 'react';
import type { ZinePage } from '../../types';
import type { PreviewAsset } from './readingOrder';

type ReadingOrderPreviewProps = {
  pages: readonly ZinePage[];
  assetMap: Record<string, PreviewAsset>;
};

function pageRoleLabel(page: ZinePage) {
  if (page.role === 'front-cover') {
    return 'Front cover';
  }

  if (page.role === 'back-cover') {
    return 'Back cover';
  }

  if (page.role === 'blank') {
    return 'Blank page';
  }

  return 'Body page';
}

function frameStyle(frame: ZinePage['frames'][number]): CSSProperties {
  return {
    left: `${frame.x * 100}%`,
    top: `${frame.y * 100}%`,
    width: `${frame.width * 100}%`,
    height: `${frame.height * 100}%`,
  };
}

function mediaStyle(rotationQuarterTurns: number): CSSProperties {
  return {
    transform: `rotate(${rotationQuarterTurns * 90}deg)`,
  };
}

export function ReadingOrderPreview({ pages, assetMap }: ReadingOrderPreviewProps) {
  return (
    <div className="reading-preview">
      {pages.map((page) => (
        <article className="reading-preview__page-card" key={page.id}>
          <div className="reading-preview__page-meta">
            <strong>Page {page.pageNumber}</strong>
            <span>{pageRoleLabel(page)}</span>
          </div>

          <div
            aria-label={`Preview of page ${page.pageNumber}`}
            className={`reading-preview__page reading-preview__page--${page.role}`}
          >
            {page.frames.map((frame) => {
              const asset = frame.assetId ? assetMap[frame.assetId] : null;

              if (!asset) {
                return null;
              }

              return (
                <div className="reading-preview__frame" key={frame.id} style={frameStyle(frame)}>
                  <img
                    alt={`${asset.fileName} on page ${page.pageNumber}`}
                    className="reading-preview__image"
                    src={asset.previewUrl}
                    style={mediaStyle(frame.rotationQuarterTurns)}
                  />
                </div>
              );
            })}

            {page.frames.length === 0 ? (
              <div className="reading-preview__blank-label">
                {page.role === 'back-cover' ? 'Blank back cover' : 'Blank'}
              </div>
            ) : null}
          </div>

          <p className="reading-preview__caption">
            {page.sourceAssetIds.length > 0
              ? page.sourceAssetIds
                  .map((assetId) => assetMap[assetId]?.fileName ?? assetId)
                  .join(' + ')
              : pageRoleLabel(page)}
          </p>
        </article>
      ))}
    </div>
  );
}
