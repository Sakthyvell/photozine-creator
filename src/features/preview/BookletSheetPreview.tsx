import type { BookletSheet } from '../../lib/booklet';

type BookletSheetPreviewProps = {
  sheets: readonly BookletSheet[];
};

function pageLabel(sheetPage: BookletSheet['front']['leftPage']) {
  return `Page ${sheetPage.pageNumber}`;
}

function pageRoleLabel(sheetPage: BookletSheet['front']['leftPage']) {
  if (sheetPage.role === 'front-cover') {
    return 'Front cover';
  }

  if (sheetPage.role === 'back-cover') {
    return 'Back cover';
  }

  if (sheetPage.role === 'blank') {
    return 'Blank';
  }

  return 'Body';
}

export function BookletSheetPreview({ sheets }: BookletSheetPreviewProps) {
  return (
    <div className="booklet-preview">
      {sheets.map((sheet) => (
        <article className="booklet-preview__sheet" key={sheet.id}>
          <div className="booklet-preview__sheet-header">
            <strong>Sheet {sheet.sheetNumber}</strong>
            <span>A4 duplex</span>
          </div>

          {[sheet.front, sheet.back].map((side) => (
            <div className="booklet-preview__side" key={side.id}>
              <div className="booklet-preview__side-header">
                <span>{side.side === 'front' ? 'Front side' : 'Back side'}</span>
              </div>
              <div className="booklet-preview__spread">
                <div className="booklet-preview__spread-page">
                  <strong>{pageLabel(side.leftPage)}</strong>
                  <span>{pageRoleLabel(side.leftPage)}</span>
                </div>
                <div className="booklet-preview__spread-page">
                  <strong>{pageLabel(side.rightPage)}</strong>
                  <span>{pageRoleLabel(side.rightPage)}</span>
                </div>
              </div>
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}
