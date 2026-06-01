import { z } from 'zod';

export const supportedImageFormatSchema = z.enum(['image/jpeg', 'image/png']);
export type SupportedImageFormat = z.infer<typeof supportedImageFormatSchema>;

export const orientationSchema = z.enum(['portrait', 'landscape', 'square']);
export type Orientation = z.infer<typeof orientationSchema>;

export const photoWarningSeveritySchema = z.enum(['info', 'warning', 'error']);
export type PhotoWarningSeverity = z.infer<typeof photoWarningSeveritySchema>;

export const photoWarningCodeSchema = z.enum([
  'unsupported-file-type',
  'low-resolution',
  'possible-duplicate',
  'missing-required-cover',
  'page-count-over-target',
  'override-repaired',
]);
export type PhotoWarningCode = z.infer<typeof photoWarningCodeSchema>;

export const warningScopeSchema = z.enum([
  'front-cover',
  'back-cover',
  'body-photo',
  'planner',
  'export',
  'session',
]);
export type WarningScope = z.infer<typeof warningScopeSchema>;

export const photoWarningSchema = z.object({
  id: z.string().min(1),
  code: photoWarningCodeSchema,
  severity: photoWarningSeveritySchema,
  scope: warningScopeSchema,
  message: z.string().min(1),
  assetId: z.string().min(1).nullable(),
});
export type PhotoWarning = z.infer<typeof photoWarningSchema>;

export const quarterTurnSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
export type QuarterTurn = z.infer<typeof quarterTurnSchema>;

export const planningModeSchema = z.enum([
  'favor-larger-photos',
  'favor-fewer-pages',
]);
export type PlanningMode = z.infer<typeof planningModeSchema>;

export const bodyLayoutIdSchema = z.enum([
  'single-portrait',
  'two-portraits',
  'two-landscapes',
  'landscape-spread',
]);
export type BodyLayoutId = z.infer<typeof bodyLayoutIdSchema>;

export const pageLayoutIdSchema = z.union([
  z.literal('cover-full'),
  z.literal('blank'),
  bodyLayoutIdSchema,
]);
export type PageLayoutId = z.infer<typeof pageLayoutIdSchema>;

export const fitModeSchema = z.literal('contain');
export type FitMode = z.infer<typeof fitModeSchema>;

export const assetKindSchema = z.enum(['cover', 'body']);
export type AssetKind = z.infer<typeof assetKindSchema>;

export const coverRoleSchema = z.enum(['front', 'back']);
export type CoverRole = z.infer<typeof coverRoleSchema>;

export const photoAssetSchema = z.object({
  id: z.string().min(1),
  kind: assetKindSchema,
  fileName: z.string().min(1),
  format: supportedImageFormatSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fileSizeBytes: z.number().int().nonnegative(),
  aspectRatio: z.number().positive(),
  orientation: orientationSchema,
  exifOrientation: z.number().int().positive().max(8).nullable(),
  previewUrl: z.string().min(1),
  included: z.boolean(),
  rotationQuarterTurns: quarterTurnSchema,
  warnings: z.array(photoWarningSchema),
});
export type PhotoAsset = z.infer<typeof photoAssetSchema>;

export const coverAssetSchema = photoAssetSchema.extend({
  kind: z.literal('cover'),
  coverRole: coverRoleSchema,
  required: z.boolean(),
  isFallbackBlank: z.boolean(),
});
export type CoverAsset = z.infer<typeof coverAssetSchema>;

export const bodyPhotoSchema = photoAssetSchema.extend({
  kind: z.literal('body'),
  sourceOrder: z.number().int().nonnegative(),
});
export type BodyPhoto = z.infer<typeof bodyPhotoSchema>;

export const pageFrameSchema = z.object({
  id: z.string().min(1),
  pageId: z.string().min(1),
  assetId: z.string().min(1).nullable(),
  slotIndex: z.number().int().nonnegative(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().positive().max(1),
  height: z.number().positive().max(1),
  fitMode: fitModeSchema,
  rotationQuarterTurns: quarterTurnSchema,
});
export type PageFrame = z.infer<typeof pageFrameSchema>;

export const zinePageRoleSchema = z.enum([
  'front-cover',
  'back-cover',
  'body',
  'blank',
]);
export type ZinePageRole = z.infer<typeof zinePageRoleSchema>;

export const zinePageSchema = z.object({
  id: z.string().min(1),
  pageNumber: z.number().int().positive(),
  role: zinePageRoleSchema,
  layoutId: pageLayoutIdSchema,
  spreadId: z.string().min(1).nullable(),
  locked: z.boolean(),
  frames: z.array(pageFrameSchema),
  sourceAssetIds: z.array(z.string().min(1)),
  background: z.literal('white'),
  plannerNote: z.string().min(1).nullable(),
});
export type ZinePage = z.infer<typeof zinePageSchema>;

export const spreadKindSchema = z.enum([
  'standard-spread',
  'landscape-photo-spread',
]);
export type SpreadKind = z.infer<typeof spreadKindSchema>;

export const zineSpreadSchema = z.object({
  id: z.string().min(1),
  kind: spreadKindSchema,
  leftPageId: z.string().min(1),
  rightPageId: z.string().min(1),
  layoutId: bodyLayoutIdSchema.nullable(),
  assetIds: z.array(z.string().min(1)),
  locked: z.boolean(),
});
export type ZineSpread = z.infer<typeof zineSpreadSchema>;

export const overrideRepairReasonSchema = z.enum([
  'missing-asset',
  'excluded-asset',
  'layout-conflict',
]);
export type OverrideRepairReason = z.infer<typeof overrideRepairReasonSchema>;

export const overrideRepairNoticeSchema = z.object({
  id: z.string().min(1),
  targetId: z.string().min(1),
  reason: overrideRepairReasonSchema,
  message: z.string().min(1),
});
export type OverrideRepairNotice = z.infer<typeof overrideRepairNoticeSchema>;

export const manualBlankInsertionSchema = z.object({
  id: z.string().min(1),
  afterPageId: z.string().min(1).nullable(),
});
export type ManualBlankInsertion = z.infer<typeof manualBlankInsertionSchema>;

export const overrideStateSchema = z.object({
  lockedPageIds: z.array(z.string().min(1)),
  lockedSpreadIds: z.array(z.string().min(1)),
  excludedAssetIds: z.array(z.string().min(1)),
  pageLayoutAssignments: z.record(z.string().min(1), pageLayoutIdSchema),
  spreadLayoutAssignments: z.record(z.string().min(1), bodyLayoutIdSchema),
  assetRotations: z.record(z.string().min(1), quarterTurnSchema),
  manualBlankInsertions: z.array(manualBlankInsertionSchema),
  repairNotices: z.array(overrideRepairNoticeSchema),
});
export type OverrideState = z.infer<typeof overrideStateSchema>;

export const exportSettingsSchema = z.object({
  paperSize: z.literal('A4'),
  foldedPageSize: z.literal('A5'),
  duplexMode: z.literal('long-edge'),
  includeFoldGuides: z.boolean(),
  safeMarginMm: z.number().positive(),
  pageCountMultiple: z.literal(4),
  backgroundColor: z.literal('#ffffff'),
});
export type ExportSettings = z.infer<typeof exportSettingsSchema>;

export const sessionPreferencesSchema = z.object({
  lastUsedPlanningMode: planningModeSchema,
  rememberPlanningMode: z.boolean(),
});
export type SessionPreferences = z.infer<typeof sessionPreferencesSchema>;

export const appSessionStateSchema = z.object({
  planningMode: planningModeSchema,
  frontCover: coverAssetSchema.nullable(),
  backCover: coverAssetSchema.nullable(),
  bodyPhotos: z.array(bodyPhotoSchema),
  warnings: z.array(photoWarningSchema),
  pages: z.array(zinePageSchema),
  spreads: z.array(zineSpreadSchema),
  overrides: overrideStateSchema,
  exportSettings: exportSettingsSchema,
  previewConfirmed: z.boolean(),
  preferences: sessionPreferencesSchema,
  lastPlannedAt: z.string().datetime().nullable(),
});
export type AppSessionState = z.infer<typeof appSessionStateSchema>;

