import { ActionButton } from '../../components';
import type { ReactNode } from 'react';
import type { PhotoWarning } from '../../types';
import type { IntakeAsset, UploadTarget } from './intake';

export type PendingUpload = {
  id: string;
  fileName: string;
  scope: UploadTarget;
};

export type FailedUpload = {
  id: string;
  fileName: string;
  scope: UploadTarget;
  message: string;
};

type SourceOrganizerProps = {
  frontCover: IntakeAsset | null;
  backCover: IntakeAsset | null;
  bodyPhotos: IntakeAsset[];
  warnings: PhotoWarning[];
  pendingUploads: PendingUpload[];
  failedUploads: FailedUpload[];
  onDismissWarning: (warningId: string) => void;
  onOpenFrontCoverPicker: () => void;
  onOpenBackCoverPicker: () => void;
  onOpenBodyPhotoPicker: () => void;
  onRemoveFrontCover: () => void;
  onRemoveBackCover: () => void;
  onRemoveBodyPhoto: (assetId: string) => void;
};

function formatOrientation(asset: IntakeAsset) {
  return `${asset.orientation}, ${asset.width} x ${asset.height}px`;
}

function warningTone(severity: PhotoWarning['severity']) {
  if (severity === 'error') {
    return 'upload-warning--error';
  }

  if (severity === 'warning') {
    return 'upload-warning--warning';
  }

  return 'upload-warning--info';
}

function assetWarnings(assetId: string, warnings: PhotoWarning[]) {
  return warnings.filter((warning) => warning.assetId === assetId);
}

function renderWarningList(
  warnings: PhotoWarning[],
  onDismissWarning: (warningId: string) => void,
) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <ul className="upload-warning-list upload-warning-list--compact" aria-live="polite">
      {warnings.map((warning) => (
        <li className={`upload-warning ${warningTone(warning.severity)}`} key={warning.id}>
          <span>{warning.message}</span>
          <button
            className="upload-warning__dismiss"
            onClick={() => onDismissWarning(warning.id)}
            type="button"
          >
            Dismiss
          </button>
        </li>
      ))}
    </ul>
  );
}

function renderPendingItem(id: string, fileName: string) {
  return (
    <div
      key={id}
      className="source-item source-item--pending"
      aria-label={`${fileName} is loading`}
    >
      <div className="source-item__preview source-item__preview--pending">
        <span className="source-item__status">Loading</span>
      </div>
      <div className="source-item__meta">
        <strong>{fileName}</strong>
        <p>Reading image metadata and preparing the preview.</p>
      </div>
    </div>
  );
}

function renderFailedItem(id: string, fileName: string, message: string) {
  return (
    <div
      key={id}
      className="source-item source-item--failed"
      aria-label={`${fileName} failed to load`}
    >
      <div className="source-item__preview source-item__preview--failed">
        <span className="source-item__status">Failed</span>
      </div>
      <div className="source-item__meta">
        <strong>{fileName}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

function renderAssetCard(
  key: string,
  asset: IntakeAsset,
  actions: ReactNode,
  warnings: PhotoWarning[],
  onDismissWarning: (warningId: string) => void,
) {
  const visibleWarnings = assetWarnings(asset.id, warnings);

  return (
    <article key={key} className="source-item">
      <img
        alt={`${asset.fileName} preview`}
        className="source-item__preview"
        src={asset.previewUrl}
      />
      <div className="source-item__meta">
        <div className="source-item__headline">
          <div>
            <strong>{asset.fileName}</strong>
            <p>{formatOrientation(asset)}</p>
          </div>
          <span className="source-item__badge">{asset.fileSizeBytes.toLocaleString()} bytes</span>
        </div>
        {renderWarningList(visibleWarnings, onDismissWarning)}
        <div className="source-item__actions">{actions}</div>
      </div>
    </article>
  );
}

export function SourceOrganizer({
  frontCover,
  backCover,
  bodyPhotos,
  warnings,
  pendingUploads,
  failedUploads,
  onDismissWarning,
  onOpenFrontCoverPicker,
  onOpenBackCoverPicker,
  onOpenBodyPhotoPicker,
  onRemoveFrontCover,
  onRemoveBackCover,
  onRemoveBodyPhoto,
}: SourceOrganizerProps) {
  const frontPending = pendingUploads.filter((item) => item.scope === 'front-cover');
  const backPending = pendingUploads.filter((item) => item.scope === 'back-cover');
  const bodyPending = pendingUploads.filter((item) => item.scope === 'body-photo');

  const frontFailures = failedUploads.filter((item) => item.scope === 'front-cover');
  const backFailures = failedUploads.filter((item) => item.scope === 'back-cover');
  const bodyFailures = failedUploads.filter((item) => item.scope === 'body-photo');

  return (
    <section className="source-organizer" aria-labelledby="source-organizer-title">
      <div className="section-card__header">
        <p className="section-card__eyebrow">Organizer</p>
        <h2 className="section-card__title" id="source-organizer-title">
          Review the uploaded sources
        </h2>
        <p className="section-card__description">
          Covers stay separate from body photos, and each source shows its preview,
          orientation, and any advisory warnings.
        </p>
      </div>

      <div className="source-organizer__grid">
        <article className="source-organizer__section">
          <div className="source-organizer__section-header">
            <div>
              <h3>Front cover</h3>
              <p>Required for export. Replace it whenever you find a better scan.</p>
            </div>
            <div className="source-organizer__section-actions">
              <ActionButton onClick={onOpenFrontCoverPicker} tone="primary">
                Replace
              </ActionButton>
              <ActionButton disabled={!frontCover} onClick={onRemoveFrontCover}>
                Remove
              </ActionButton>
            </div>
          </div>

          {frontCover ? (
            renderAssetCard(
              frontCover.id,
              frontCover,
              <ActionButton onClick={onOpenFrontCoverPicker} tone="primary">
                Replace front cover
              </ActionButton>,
              warnings,
              onDismissWarning,
            )
          ) : (
            <div className="source-organizer__empty">No front cover selected yet.</div>
          )}

          {frontPending.map((item) => renderPendingItem(item.id, item.fileName))}
          {frontFailures.map((item) => renderFailedItem(item.id, item.fileName, item.message))}
        </article>

        <article className="source-organizer__section">
          <div className="source-organizer__section-header">
            <div>
              <h3>Back cover</h3>
              <p>Optional. Clear it to fall back to blank white.</p>
            </div>
            <div className="source-organizer__section-actions">
              <ActionButton onClick={onOpenBackCoverPicker} tone="primary">
                Replace
              </ActionButton>
              <ActionButton disabled={!backCover} onClick={onRemoveBackCover}>
                Clear
              </ActionButton>
            </div>
          </div>

          {backCover ? (
            renderAssetCard(
              backCover.id,
              backCover,
              <ActionButton onClick={onOpenBackCoverPicker} tone="primary">
                Replace back cover
              </ActionButton>,
              warnings,
              onDismissWarning,
            )
          ) : (
            <div className="source-organizer__empty">No back cover selected.</div>
          )}

          {backPending.map((item) => renderPendingItem(item.id, item.fileName))}
          {backFailures.map((item) => renderFailedItem(item.id, item.fileName, item.message))}
        </article>
      </div>

      <section className="source-organizer__section source-organizer__section--stacked">
        <div className="source-organizer__section-header">
          <div>
            <h3>Body photos</h3>
            <p>Keep the upload order visible while you refine the set.</p>
          </div>
          <ActionButton onClick={onOpenBodyPhotoPicker} tone="primary">
            Add more
          </ActionButton>
        </div>

        {bodyPhotos.length > 0 ? (
          <div className="source-organizer__list">
            {bodyPhotos.map((asset) =>
              renderAssetCard(
                asset.id,
                asset,
                <ActionButton onClick={() => onRemoveBodyPhoto(asset.id)}>Remove</ActionButton>,
                warnings,
                onDismissWarning,
              ),
            )}
          </div>
        ) : (
          <div className="source-organizer__empty">No body photos uploaded yet.</div>
        )}

        {bodyPending.map((item) => renderPendingItem(item.id, item.fileName))}
        {bodyFailures.map((item) => renderFailedItem(item.id, item.fileName, item.message))}
      </section>
    </section>
  );
}
