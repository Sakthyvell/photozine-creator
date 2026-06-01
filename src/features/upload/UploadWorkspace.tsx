import { useId, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, RefObject } from 'react';
import type { PhotoWarning } from '../../types';
import { ActionButton, StatusBanner } from '../../components';
import type { IntakeAsset } from './intake';

type UploadWorkspaceProps = {
  frontCover: IntakeAsset | null;
  backCover: IntakeAsset | null;
  bodyPhotos: IntakeAsset[];
  warnings: PhotoWarning[];
  onFrontCoverFiles: (files: File[]) => void;
  onBackCoverFiles: (files: File[]) => void;
  onBodyPhotoFiles: (files: File[]) => void;
};

const acceptedFileInputTypes = '.jpg,.jpeg,.png,image/jpeg,image/png';

function fileCountLabel(count: number) {
  return `${count} file${count === 1 ? '' : 's'} selected`;
}

function fileListLabel(files: IntakeAsset[]) {
  if (files.length === 0) {
    return 'None yet';
  }

  const visibleNames = files.slice(0, 3).map((asset) => asset.fileName);
  const overflowCount = files.length - visibleNames.length;

  return overflowCount > 0
    ? `${visibleNames.join(', ')} +${overflowCount} more`
    : visibleNames.join(', ');
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

export function UploadWorkspace({
  frontCover,
  backCover,
  bodyPhotos,
  warnings,
  onFrontCoverFiles,
  onBackCoverFiles,
  onBodyPhotoFiles,
}: UploadWorkspaceProps) {
  const frontInputId = useId();
  const backInputId = useId();
  const bodyInputId = useId();
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingBodyFiles, setIsDraggingBodyFiles] = useState(false);

  function readSelectedFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    return files;
  }

  function openPicker(inputRef: RefObject<HTMLInputElement>) {
    inputRef.current?.click();
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDraggingBodyFiles(false);
    onBodyPhotoFiles(Array.from(event.dataTransfer.files ?? []));
  }

  const frontWarnings = warnings.filter((warning) => warning.scope === 'front-cover');
  const backWarnings = warnings.filter((warning) => warning.scope === 'back-cover');
  const bodyWarnings = warnings.filter((warning) => warning.scope === 'body-photo');

  return (
    <section className="upload-workspace" aria-labelledby="upload-workspace-title">
      <div className="upload-workspace__header">
        <div>
          <p className="section-card__eyebrow">Upload</p>
          <h2 className="section-card__title" id="upload-workspace-title">
            Collect the cover assets and body photos
          </h2>
          <p className="section-card__description">
            Separate slots keep the required front cover isolated from the optional
            back cover and the body photo stream.
          </p>
        </div>
        <div className="upload-workspace__summary" aria-label="Upload counts">
          <div>
            <span className="upload-workspace__summary-label">Front cover</span>
            <strong>{fileCountLabel(frontCover ? 1 : 0)}</strong>
          </div>
          <div>
            <span className="upload-workspace__summary-label">Back cover</span>
            <strong>{fileCountLabel(backCover ? 1 : 0)}</strong>
          </div>
          <div>
            <span className="upload-workspace__summary-label">Body photos</span>
            <strong>{fileCountLabel(bodyPhotos.length)}</strong>
          </div>
        </div>
      </div>

      <StatusBanner
        tone={frontCover ? 'success' : 'warning'}
        title={frontCover ? 'Front cover ready' : 'Front cover required before export'}
        message={
          frontCover
            ? 'Back cover stays optional here. If you leave it blank, the export step will fill it with white.'
            : 'Upload a front cover first so the export flow can unlock later in the workflow.'
        }
        meta={
          warnings.length > 0
            ? `${warnings.length} non-blocking validation warning${warnings.length === 1 ? '' : 's'} are shown below.`
            : 'Only JPG, JPEG, and PNG files are accepted at intake.'
        }
      />

      <div className="upload-grid">
        <section className="upload-zone">
          <div className="upload-zone__header">
            <div>
              <h3 className="upload-zone__title">Front cover</h3>
              <p className="upload-zone__description">
                Required before export. Keep the cover separate from the body photos.
              </p>
            </div>
            <span className="upload-zone__count">{fileCountLabel(frontCover ? 1 : 0)}</span>
          </div>

          <div className="upload-zone__panel">
            <p className="upload-zone__empty">
              {frontCover
                ? `${frontCover.fileName} is selected.`
                : 'No front cover selected yet.'}
            </p>
            <p className="upload-zone__hint">Accepted files: JPG, JPEG, PNG.</p>
            <div className="upload-zone__actions">
              <ActionButton
                className="upload-zone__button"
                onClick={() => openPicker(frontInputRef)}
                tone="primary"
              >
                Choose front cover
              </ActionButton>
            </div>
            <input
              ref={frontInputRef}
              aria-label="Front cover file picker"
              accept={acceptedFileInputTypes}
              className="upload-zone__input"
              id={frontInputId}
              type="file"
              onChange={(event) => {
                onFrontCoverFiles(readSelectedFiles(event));
              }}
            />
          </div>

          {frontCover ? (
            <p className="upload-zone__files">
              Selected file: <strong>{frontCover.fileName}</strong>
            </p>
          ) : null}
          {frontWarnings.length > 0 ? (
            <ul className="upload-warning-list" aria-live="polite">
              {frontWarnings.map((warning) => (
                <li className={`upload-warning ${warningTone(warning.severity)}`} key={warning.id}>
                  {warning.message}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="upload-zone">
          <div className="upload-zone__header">
            <div>
              <h3 className="upload-zone__title">Back cover</h3>
              <p className="upload-zone__description">
                Optional. If you skip it, the export flow will default to blank white.
              </p>
            </div>
            <span className="upload-zone__count">{fileCountLabel(backCover ? 1 : 0)}</span>
          </div>

          <div className="upload-zone__panel">
            <p className="upload-zone__empty">
              {backCover
                ? `${backCover.fileName} is selected.`
                : 'No back cover selected. Blank white will be used instead.'}
            </p>
            <p className="upload-zone__hint">Accepted files: JPG, JPEG, PNG.</p>
            <div className="upload-zone__actions">
              <ActionButton
                className="upload-zone__button"
                onClick={() => openPicker(backInputRef)}
                tone="primary"
              >
                Choose back cover
              </ActionButton>
            </div>
            <input
              ref={backInputRef}
              aria-label="Back cover file picker"
              accept={acceptedFileInputTypes}
              className="upload-zone__input"
              id={backInputId}
              type="file"
              onChange={(event) => {
                onBackCoverFiles(readSelectedFiles(event));
              }}
            />
          </div>

          {backCover ? (
            <p className="upload-zone__files">
              Selected file: <strong>{backCover.fileName}</strong>
            </p>
          ) : null}
          {backWarnings.length > 0 ? (
            <ul className="upload-warning-list" aria-live="polite">
              {backWarnings.map((warning) => (
                <li className={`upload-warning ${warningTone(warning.severity)}`} key={warning.id}>
                  {warning.message}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section
          className={`upload-zone upload-zone--body ${
            isDraggingBodyFiles ? 'upload-zone--dragging' : ''
          }`}
          onDragLeave={() => setIsDraggingBodyFiles(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingBodyFiles(true);
          }}
          onDrop={handleDrop}
        >
          <div className="upload-zone__header">
            <div>
              <h3 className="upload-zone__title">Body photos</h3>
              <p className="upload-zone__description">
                Add these separately from the cover slots. Drag and drop works here.
              </p>
            </div>
            <span className="upload-zone__count">{fileCountLabel(bodyPhotos.length)}</span>
          </div>

          <div className="upload-zone__panel upload-zone__panel--body">
            <p className="upload-zone__empty">
              {bodyPhotos.length > 0
                ? 'Body photos are organized in upload order.'
                : 'Drop JPG or PNG files here, or use the file picker.'}
            </p>
            <p className="upload-zone__hint">
              You can add many photos at once. Unsupported files stay out of the batch.
            </p>
            <div className="upload-zone__actions">
              <ActionButton
                className="upload-zone__button"
                onClick={() => openPicker(bodyInputRef)}
                tone="primary"
              >
                Choose body photos
              </ActionButton>
            </div>
            <input
              ref={bodyInputRef}
              aria-label="Body photo file picker"
              accept={acceptedFileInputTypes}
              className="upload-zone__input"
              id={bodyInputId}
              multiple
              type="file"
              onChange={(event) => {
                onBodyPhotoFiles(readSelectedFiles(event));
              }}
            />
          </div>

          <div className="upload-zone__files">
            <strong>{bodyPhotos.length > 0 ? 'Selected files' : 'No body photos yet'}</strong>
            <p>{fileListLabel(bodyPhotos)}</p>
          </div>
          {bodyWarnings.length > 0 ? (
            <ul className="upload-warning-list upload-warning-list--body" aria-live="polite">
              {bodyWarnings.map((warning) => (
                <li className={`upload-warning ${warningTone(warning.severity)}`} key={warning.id}>
                  {warning.message}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      {warnings.length > 0 ? (
        <aside className="upload-note" aria-label="Validation summary">
          <p className="upload-note__title">Validation summary</p>
          <p className="upload-note__body">
            Unsupported files were skipped, but valid images from the same batch were
            kept. That lets you clean up the intake without redoing the whole batch.
          </p>
        </aside>
      ) : null}
    </section>
  );
}
