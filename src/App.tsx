import { useEffect, useRef, useState } from 'react';
import './styles.css';
import { ActionButton, SectionCard, StatusBanner, StepIndicator } from './components';
import {
  createMinimalPlan,
  exportFeature,
  plannerFeature,
  previewFeature,
  uploadFeature,
} from './features';
import {
  buildQualityWarnings,
  createIntakeAsset,
  partitionSupportedFiles,
  revokeIntakeAssetPreview,
  type FailedUpload,
  type IntakeAsset,
  type PendingUpload,
} from './features/upload';
import { extractImageMetadata } from './lib/image';
import type { PlanningMode, PhotoWarning } from './types';
import { SourceOrganizer, UploadWorkspace } from './features/upload';

const planningModeStorageKey = 'photo-zine-maker.planningMode';

function getInitialPlanningMode(): PlanningMode {
  if (typeof window === 'undefined') {
    return 'favor-larger-photos';
  }

  const storedPlanningMode = window.localStorage.getItem(planningModeStorageKey);

  return storedPlanningMode === 'favor-fewer-pages'
    ? 'favor-fewer-pages'
    : 'favor-larger-photos';
}

function planningModeLabel(mode: PlanningMode) {
  return mode === 'favor-fewer-pages' ? 'Favor fewer pages' : 'Favor larger photos';
}

const steps = [
  { key: uploadFeature.key, label: uploadFeature.title, state: 'current' as const },
  { key: plannerFeature.key, label: plannerFeature.title, state: 'upcoming' as const },
  { key: previewFeature.key, label: previewFeature.title, state: 'upcoming' as const },
  { key: exportFeature.key, label: exportFeature.title, state: 'upcoming' as const },
];

function statValueLabel(isSelected: boolean, fallback: string) {
  return isSelected ? 'Selected' : fallback;
}

function plannerLayoutLabel(layoutId: string) {
  if (layoutId === 'single-portrait') {
    return 'Single image';
  }

  if (layoutId === 'two-portraits') {
    return 'Two portraits';
  }

  if (layoutId === 'two-landscapes') {
    return 'Two landscapes';
  }

  return 'Landscape spread';
}

export function App() {
  const [frontCover, setFrontCover] = useState<IntakeAsset | null>(null);
  const [backCover, setBackCover] = useState<IntakeAsset | null>(null);
  const [bodyPhotos, setBodyPhotos] = useState<IntakeAsset[]>([]);
  const [warnings, setWarnings] = useState<PhotoWarning[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);
  const [planningMode, setPlanningMode] = useState<PlanningMode>(getInitialPlanningMode);
  const assetSequence = useRef(1);
  const warningSequence = useRef(1);
  const pendingSequence = useRef(1);
  const failureSequence = useRef(1);
  const frontCoverRef = useRef<IntakeAsset | null>(null);
  const backCoverRef = useRef<IntakeAsset | null>(null);
  const bodyPhotosRef = useRef<IntakeAsset[]>([]);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

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

  function nextPendingId() {
    const id = `pending-${pendingSequence.current}`;
    pendingSequence.current += 1;
    return id;
  }

  function nextFailureId() {
    const id = `failure-${failureSequence.current}`;
    failureSequence.current += 1;
    return id;
  }

  function appendWarnings(nextWarnings: PhotoWarning[]) {
    if (nextWarnings.length === 0) {
      return;
    }

    setWarnings((currentWarnings) => [...currentWarnings, ...nextWarnings]);
  }

  function removeWarningsForAsset(assetId: string) {
    setWarnings((currentWarnings) =>
      currentWarnings.filter((warning) => warning.assetId !== assetId),
    );
  }

  function dismissWarning(warningId: string) {
    setWarnings((currentWarnings) =>
      currentWarnings.filter((warning) => warning.id !== warningId),
    );
  }

  function addPendingUpload(fileName: string, scope: PendingUpload['scope']) {
    const pendingUpload: PendingUpload = {
      id: nextPendingId(),
      fileName,
      scope,
    };

    setPendingUploads((currentPendingUploads) => [...currentPendingUploads, pendingUpload]);

    return pendingUpload;
  }

  function removePendingUpload(pendingUploadId: string) {
    setPendingUploads((currentPendingUploads) =>
      currentPendingUploads.filter((pendingUpload) => pendingUpload.id !== pendingUploadId),
    );
  }

  function addFailedUpload(fileName: string, scope: FailedUpload['scope'], message: string) {
    const failedUpload: FailedUpload = {
      id: nextFailureId(),
      fileName,
      scope,
      message,
    };

    setFailedUploads((currentFailedUploads) => [...currentFailedUploads, failedUpload]);

    return failedUpload;
  }

  useEffect(() => {
    frontCoverRef.current = frontCover;
  }, [frontCover]);

  useEffect(() => {
    backCoverRef.current = backCover;
  }, [backCover]);

  useEffect(() => {
    bodyPhotosRef.current = bodyPhotos;
  }, [bodyPhotos]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(planningModeStorageKey, planningMode);
  }, [planningMode]);

  useEffect(() => {
    return () => {
      revokeIntakeAssetPreview(frontCoverRef.current);
      revokeIntakeAssetPreview(backCoverRef.current);
      bodyPhotosRef.current.forEach((asset) => {
        revokeIntakeAssetPreview(asset);
      });
    };
  }, []);

  async function buildIntakeAsset(file: File, scope: 'front-cover' | 'back-cover' | 'body-photo') {
    const metadata = await extractImageMetadata(file);
    return createIntakeAsset(file, scope, metadata, () => nextAssetId(scope));
  }

  function openFrontCoverPicker() {
    frontInputRef.current?.click();
  }

  function openBackCoverPicker() {
    backInputRef.current?.click();
  }

  function openBodyPhotoPicker() {
    bodyInputRef.current?.click();
  }

  function clearFrontCover() {
    if (!frontCoverRef.current) {
      return;
    }

    removeWarningsForAsset(frontCoverRef.current.id);
    revokeIntakeAssetPreview(frontCoverRef.current);
    setFrontCover(null);
  }

  function clearBackCover() {
    if (!backCoverRef.current) {
      return;
    }

    removeWarningsForAsset(backCoverRef.current.id);
    revokeIntakeAssetPreview(backCoverRef.current);
    setBackCover(null);
  }

  function removeBodyPhoto(assetId: string) {
    const removedBodyPhoto = bodyPhotosRef.current.find((asset) => asset.id === assetId);
    if (!removedBodyPhoto) {
      return;
    }

    removeWarningsForAsset(assetId);
    revokeIntakeAssetPreview(removedBodyPhoto);
    setBodyPhotos((currentBodyPhotos) =>
      currentBodyPhotos
        .filter((asset) => asset.id !== assetId)
        .map((asset, index) => ({
          ...asset,
          sourceOrder: index,
        })),
    );
  }

  async function handleCoverFiles(scope: 'front-cover' | 'back-cover', files: File[]) {
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

    const pendingUpload = addPendingUpload(selectedFile.name, scope);
    try {
      const nextAsset = await buildIntakeAsset(selectedFile, scope);
      const comparisonAssets = [
        ...(scope === 'front-cover' && backCoverRef.current ? [backCoverRef.current] : []),
        ...(scope === 'back-cover' && frontCoverRef.current ? [frontCoverRef.current] : []),
        ...bodyPhotosRef.current,
      ];
      const nextQualityWarnings = buildQualityWarnings(
        nextAsset,
        comparisonAssets,
        nextWarningId,
      );

      if (scope === 'front-cover') {
        const previousFrontCover = frontCoverRef.current;
        setFrontCover(nextAsset);
        if (previousFrontCover) {
          removeWarningsForAsset(previousFrontCover.id);
          revokeIntakeAssetPreview(previousFrontCover);
        }
      } else {
        const previousBackCover = backCoverRef.current;
        setBackCover(nextAsset);
        if (previousBackCover) {
          removeWarningsForAsset(previousBackCover.id);
          revokeIntakeAssetPreview(previousBackCover);
        }
      }

      appendWarnings(nextQualityWarnings);
    } catch {
      const message = `${selectedFile.name} could not be read and was left out of the organizer. Try re-exporting the file or using a different image copy.`;
      addFailedUpload(selectedFile.name, scope, message);
      appendWarnings([
        {
          id: nextWarningId(),
          code: 'metadata-extraction-failed',
          severity: 'error',
          scope,
          message,
          assetId: null,
        },
      ]);
    } finally {
      removePendingUpload(pendingUpload.id);
    }
  }

  async function handleBodyFiles(files: File[]) {
    const { acceptedFiles, warnings: validationWarnings } = partitionSupportedFiles(
      files,
      'body-photo',
      nextWarningId,
    );
    appendWarnings(validationWarnings);

    if (acceptedFiles.length === 0) {
      return;
    }

    const nextPendingUploads = acceptedFiles.map((file) => addPendingUpload(file.name, 'body-photo'));
    const nextBodyPhotoResults = await Promise.allSettled(
      acceptedFiles.map((file) => buildIntakeAsset(file, 'body-photo')),
    );

    const nextBodyPhotos: IntakeAsset[] = [];
    const nextQualityWarnings: PhotoWarning[] = [];

    nextBodyPhotoResults.forEach((result, index) => {
      const pendingUpload = nextPendingUploads[index];
      if (result.status === 'fulfilled') {
        const asset = result.value;
        const existingAssets = [
          ...(frontCoverRef.current ? [frontCoverRef.current] : []),
          ...(backCoverRef.current ? [backCoverRef.current] : []),
          ...bodyPhotosRef.current,
          ...nextBodyPhotos,
        ];

        nextBodyPhotos.push(asset);
        nextQualityWarnings.push(
          ...buildQualityWarnings(asset, existingAssets, nextWarningId),
        );
      } else {
        const fileName = acceptedFiles[index]?.name ?? pendingUpload.fileName;
        const message = `${fileName} could not be read and was left out of the organizer. Try re-exporting the file or using a different image copy.`;
        addFailedUpload(fileName, 'body-photo', message);
        appendWarnings([
          {
            id: nextWarningId(),
            code: 'metadata-extraction-failed',
            severity: 'error',
            scope: 'body-photo',
            message,
            assetId: null,
          },
        ]);
      }

      removePendingUpload(pendingUpload.id);
    });

    if (nextBodyPhotos.length > 0) {
      setBodyPhotos((currentBodyPhotos) => [
        ...currentBodyPhotos,
        ...nextBodyPhotos.map((asset, index) => ({
          ...asset,
          sourceOrder: currentBodyPhotos.length + index,
        })),
      ]);
      appendWarnings(nextQualityWarnings);
    }
  }

  const exportReady = Boolean(frontCover);
  const warningCount = warnings.length;
  const plannerResult = createMinimalPlan(bodyPhotos, planningMode);
  const plannerHasPhotos = plannerResult.photoCount > 0;
  const plannerEstimatedTotalPages = plannerResult.pages.length + 2;

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
          backInputRef={backInputRef}
          bodyInputRef={bodyInputRef}
          frontInputRef={frontInputRef}
          onOpenBackCoverPicker={openBackCoverPicker}
          onOpenBodyPhotoPicker={openBodyPhotoPicker}
          onOpenFrontCoverPicker={openFrontCoverPicker}
          onDismissWarning={dismissWarning}
          onBackCoverFiles={(files) => handleCoverFiles('back-cover', files)}
          onBodyPhotoFiles={handleBodyFiles}
          onFrontCoverFiles={(files) => handleCoverFiles('front-cover', files)}
          warnings={warnings}
        />

        <SourceOrganizer
          backCover={backCover}
          bodyPhotos={bodyPhotos}
          failedUploads={failedUploads}
          frontCover={frontCover}
          onDismissWarning={dismissWarning}
          onOpenBackCoverPicker={openBackCoverPicker}
          onOpenBodyPhotoPicker={openBodyPhotoPicker}
          onOpenFrontCoverPicker={openFrontCoverPicker}
          onRemoveBackCover={clearBackCover}
          onRemoveBodyPhoto={removeBodyPhoto}
          onRemoveFrontCover={clearFrontCover}
          pendingUploads={pendingUploads}
          warnings={warnings}
        />

        <section className="workspace-grid" aria-label="App preview">
          <SectionCard
            eyebrow={plannerFeature.title}
            title="Generate layout suggestions"
            description={plannerFeature.description}
            footer={
              <div className="planner-controls">
                <div className="planner-controls__toggle" role="group" aria-label="Planning mode">
                  <ActionButton
                    aria-pressed={planningMode === 'favor-larger-photos'}
                    onClick={() => setPlanningMode('favor-larger-photos')}
                    tone={planningMode === 'favor-larger-photos' ? 'primary' : 'secondary'}
                  >
                    Favor larger photos
                  </ActionButton>
                  <ActionButton
                    aria-pressed={planningMode === 'favor-fewer-pages'}
                    onClick={() => setPlanningMode('favor-fewer-pages')}
                    tone={planningMode === 'favor-fewer-pages' ? 'primary' : 'secondary'}
                  >
                    Favor fewer pages
                  </ActionButton>
                </div>
              </div>
            }
          >
            {plannerHasPhotos ? (
              <>
                <div className="card-metrics">
                  <div>
                    <span className="card-metrics__label">Included body photos</span>
                    <strong className="card-metrics__value">{plannerResult.photoCount}</strong>
                  </div>
                  <div>
                    <span className="card-metrics__label">Suggested body pages</span>
                    <strong className="card-metrics__value">{plannerResult.pages.length}</strong>
                  </div>
                  <div>
                    <span className="card-metrics__label">Estimated total pages</span>
                    <strong className="card-metrics__value">{plannerEstimatedTotalPages}</strong>
                  </div>
                  <div>
                    <span className="card-metrics__label">Current mode</span>
                    <strong className="card-metrics__value">
                      {planningModeLabel(planningMode)}
                    </strong>
                  </div>
                </div>

                <div className="planner-summary">
                  <p className="section-note">
                    Suggested layouts: {plannerResult.layoutCounts['single-portrait']} single-image,{' '}
                    {plannerResult.layoutCounts['two-portraits']} two-portrait,{' '}
                    {plannerResult.layoutCounts['two-landscapes']} two-landscape.
                  </p>

                  <ol className="planner-page-list">
                    {plannerResult.pages.map((page) => (
                      <li className="planner-page-item" key={page.id}>
                        <div className="planner-page-item__header">
                          <strong>Page {page.pageNumber}</strong>
                          <span>{plannerLayoutLabel(page.layoutId)}</span>
                        </div>
                        <p>
                          {page.sourceAssetIds
                            .map(
                              (assetId) =>
                                bodyPhotos.find((photo) => photo.id === assetId)?.fileName ?? assetId,
                            )
                            .join(' + ')}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            ) : (
              <>
                <p className="section-note">
                  Upload body photos to generate the first suggested page sequence.
                </p>
                <p className="section-note">
                  Last used mode: <strong>{planningModeLabel(planningMode)}</strong>
                </p>
              </>
            )}
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
