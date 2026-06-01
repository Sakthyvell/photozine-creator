import './styles.css';
import { ActionButton, SectionCard, StatusBanner, StepIndicator } from './components';
import { exportFeature, plannerFeature, previewFeature, uploadFeature } from './features';
import { getBlankPageCount, padPageCountToMultipleOfFour } from './lib/booklet';
import { roundTo } from './lib/math';
import { sampleAppSessionState } from './fixtures/sample-data';

const steps = [
  { key: uploadFeature.key, label: uploadFeature.title, state: 'current' as const },
  { key: plannerFeature.key, label: plannerFeature.title, state: 'upcoming' as const },
  { key: previewFeature.key, label: previewFeature.title, state: 'upcoming' as const },
  { key: exportFeature.key, label: exportFeature.title, state: 'upcoming' as const },
];

export function App() {
  const { bodyPhotos, warnings, frontCover, previewConfirmed } = sampleAppSessionState;
  const pageCount = sampleAppSessionState.pages.length;
  const paddedPageCount = padPageCountToMultipleOfFour(pageCount);
  const blankPageCount = getBlankPageCount(pageCount);
  const exportReady = Boolean(frontCover) && previewConfirmed;

  return (
    <div className="app-background">
      <main className="app-shell">
        <header className="hero">
          <div className="hero__copy">
            <p className="eyebrow">Photo Zine Maker</p>
            <h1>Build a print-ready photo zine without the design busywork.</h1>
            <p className="lead">
              A local-first workspace for covers, body photos, layout suggestions,
              preview, and export. It is intentionally opinionated so the workflow
              stays calm and predictable.
            </p>
          </div>

          <aside className="hero__stats" aria-label="Project snapshot">
            <div className="stat-card">
              <span className="stat-card__label">Body photos</span>
              <strong className="stat-card__value">{bodyPhotos.length}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Warnings</span>
              <strong className="stat-card__value">{warnings.length}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-card__label">Padded pages</span>
              <strong className="stat-card__value">{paddedPageCount}</strong>
            </div>
          </aside>
        </header>

        <StatusBanner
          tone={exportReady ? 'success' : 'warning'}
          title={exportReady ? 'Ready for export' : 'Not ready to export yet'}
          message={
            exportReady
              ? 'Front cover is in place and the session is ready for the confirm-and-export step.'
              : 'The front cover exists, but preview confirmation still needs to happen before export.'
          }
          meta={
            blankPageCount > 0
              ? `${blankPageCount} blank page${blankPageCount === 1 ? '' : 's'} will be added to keep the booklet on a multiple of four.`
              : `The current session already fits the booklet page multiple.`
          }
        />

        <StepIndicator steps={steps} />

        <section className="workspace-grid" aria-label="App preview">
          <SectionCard
            eyebrow={uploadFeature.title}
            title="Collect the cover assets and body photos"
            description={uploadFeature.description}
            footer={<ActionButton tone="primary">Add photos</ActionButton>}
          >
            <div className="card-metrics">
              <div>
                <span className="card-metrics__label">Front cover</span>
                <strong className="card-metrics__value">
                  {frontCover ? 'Added' : 'Missing'}
                </strong>
              </div>
              <div>
                <span className="card-metrics__label">Blank pages</span>
                <strong className="card-metrics__value">{blankPageCount}</strong>
              </div>
            </div>
          </SectionCard>

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
                <span className="card-metrics__label">Target sheet</span>
                <strong className="card-metrics__value">A4 duplex</strong>
              </div>
              <div>
                <span className="card-metrics__label">Safe margin</span>
                <strong className="card-metrics__value">
                  {roundTo(sampleAppSessionState.exportSettings.safeMarginMm, 0)} mm
                </strong>
              </div>
            </div>
          </SectionCard>
        </section>
      </main>
    </div>
  );
}
