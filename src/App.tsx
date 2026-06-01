import { useRef, useState } from 'react';
import './styles.css';
import { ActionButton, SectionCard, StatusBanner, StepIndicator } from './components';
import { exportFeature, plannerFeature, previewFeature, uploadFeature } from './features';
import {
  createIntakeAsset,
  partitionSupportedFiles,
  type IntakeAsset,
} from './features/upload';
import type { PhotoWarning } from './types';
import { UploadWorkspace } from './features/upload';

const steps = [
  { key: uploadFeature.key, label: uploadFeature.title, state: 'current' as const },
  { key: plannerFeature.key, label: plannerFeature.title, state: 'upcoming' as const },
  { key: previewFeature.key, label: previewFeature.title, state: 'upcoming' as const },
  { key: exportFeature.key, label: exportFeature.title, state: 'upcoming' as const },
];

function statValueLabel(isSelected: boolean, fallback: string) {
  return isSelected ? 'Selected' : fallback;
}

export function App() {
  const [frontCover, setFrontCover] = useState<IntakeAsset | null>(null);
  const [backCover, setBackCover] = useState<IntakeAsset | null>(null);
  const [bodyPhotos, setBodyPhotos] = useState<IntakeAsset[]>([]);
  const [warnings, setWarnings] = useState<PhotoWarning[]>([]);
  const assetSequence = useRef(1);
  const warningSequence = useRef(1);

  function nextAssetId(scope: string) {
    const id = `${scope}-${assetSequence.current}`;
    assetSequence.current += 1;
    return id;
  }

  function nextWarningId() {
    const id = `warning-${warningSequence.current}`;
    warningSequence.current += 1;
    return id;
  }

  function appendWarnings(nextWarnings: PhotoWarning[]) {
    if (nextWarnings.length === 0) {
      return;
    }

    setWarnings((currentWarnings) => [...currentWarnings, ...nextWarnings]);
  }

  function handleCoverFiles(scope: 'front-cover' | 'back-cover', files: File[]) {
    const { acceptedFiles, warnings: validationWarnings } = partitionSupportedFiles(
      files,
      scope,
      nextWarningId,
    );
    appendWarnings(validationWarnings);

    const selectedFile = acceptedFiles[0];
    if (!selectedFile) {
      return;
    }

    const nextAsset = createIntakeAsset(selectedFile, scope, () => nextAssetId(scope));
    if (scope === 'front-cover') {
      setFrontCover(nextAsset);
      return;
    }

    setBackCover(nextAsset);
  }

  function handleBodyFiles(files: File[]) {
    const { acceptedFiles, warnings: validationWarnings } = partitionSupportedFiles(
      files,
      'body-photo',
      nextWarningId,
    );
    appendWarnings(validationWarnings);

    if (acceptedFiles.length === 0) {
      return;
    }

    const nextBodyPhotos = acceptedFiles.map((file) =>
      createIntakeAsset(file, 'body-photo', () => nextAssetId('body-photo')),
    );

    setBodyPhotos((currentBodyPhotos) => [...currentBodyPhotos, ...nextBodyPhotos]);
  }

  const exportReady = Boolean(frontCover);
  const warningCount = warnings.length;

  return (
    <div className="app-background">
      <main className="app-shell">
        <header className="hero">
          <div className="hero__copy">
            <p className="eyebrow">Photo Zine Maker</p>
            <h1>Build a print-ready photo zine without the design busywork.</h1>
            <p className="lead">
              A local-first workspace for covers, body photos, layout suggestions,
              preview, and export. We are building the intake and validation flow
              first so the rest of the pipeline starts from clean, trusted files.
            </p>
          </div>

          <aside className="hero__stats" aria-label="Project snapshot">
            <div className="stat-card">
              <span className="stat-card__label">Front cover</span>
              <strong className="stat-card__value">
                {statValueLabel(Boolean(frontCover), 'Missing')}
              </strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Back cover</span>
              <strong className="stat-card__value">
                {statValueLabel(Boolean(backCover), 'Blank white')}
              </strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Body photos</span>
              <strong className="stat-card__value">{bodyPhotos.length}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Warnings</span>
              <strong className="stat-card__value">{warningCount}</strong>
            </div>
          </aside>
        </header>

        <StatusBanner
          tone={frontCover ? 'success' : 'warning'}
          title={frontCover ? 'Front cover ready' : 'Front cover required before export'}
          message={
            frontCover
              ? 'The back cover remains optional, and an empty back slot will default to white.'
              : 'Upload a front cover first so the intake flow can unlock the later export step.'
          }
          meta={
            warningCount > 0
              ? `${warningCount} non-blocking validation warning${warningCount === 1 ? '' : 's'} are shown below.`
              : 'Only JPG, JPEG, and PNG files are accepted at intake.'
          }
        />

        <StepIndicator steps={steps} />

        <UploadWorkspace
          backCover={backCover}
          bodyPhotos={bodyPhotos}
          frontCover={frontCover}
          onBackCoverFiles={(files) => handleCoverFiles('back-cover', files)}
          onBodyPhotoFiles={handleBodyFiles}
          onFrontCoverFiles={(files) => handleCoverFiles('front-cover', files)}
          warnings={warnings}
        />

        <section className="workspace-grid" aria-label="App preview">
          <SectionCard
            eyebrow={plannerFeature.title}
            title="Generate layout suggestions"
            description={plannerFeature.description}
            footer={
              <div className="button-row">
                <ActionButton tone="primary">Regenerate</ActionButton>
                <ActionButton>Unlock all</ActionButton>
              </div>
            }
          >
            <p className="section-note">
              This phase will eventually score layouts against orientation, aspect
              ratio, and page-count goals.
            </p>
          </SectionCard>

          <SectionCard
            eyebrow={previewFeature.title}
            title="Review the reading order"
            description={previewFeature.description}
            footer={<ActionButton tone="primary">Open preview</ActionButton>}
          >
            <p className="section-note">
              The preview will show both the page sequence and the final print-sheet
              imposition view.
            </p>
          </SectionCard>

          <SectionCard
            eyebrow={exportFeature.title}
            title="Export a print-ready PDF"
            description={exportFeature.description}
            footer={<ActionButton tone="primary" disabled={!exportReady}>Export PDF</ActionButton>}
          >
            <div className="card-metrics">
              <div>
                <span className="card-metrics__label">Front cover</span>
                <strong className="card-metrics__value">
                  {frontCover ? frontCover.fileName : 'Required'}
                </strong>
              </div>
              <div>
                <span className="card-metrics__label">Back cover</span>
                <strong className="card-metrics__value">
                  {backCover ? backCover.fileName : 'Blank white'}
                </strong>
              </div>
            </div>
          </SectionCard>
        </section>
      </main>
    </div>
  );
}
