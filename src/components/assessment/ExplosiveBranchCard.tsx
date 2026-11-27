/**
 * Per-branch explosive card (vertical jump / SLJ / 100m).
 * WHY: Mirror StrengthLiftCard — independent calc + undiluted score + single-leaf CTA
 * without touching the radar composite (/2) path on ExplosiveAssessmentPage.
 */
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EXPLOSIVE_BRANCH_TO_LEAF,
  explosiveBranchFlushTab,
  type ExplosiveBranchId,
} from '../../logic/aesthetic/pickHighestExplosiveLeaf';
import type { ExplosiveBranchResult } from '../../hooks/useExplosiveAssessmentPage';
import { flushExplosiveDraft } from '../../hooks/flushSingleLeafAssessmentDraft';
import { useScoreMeaning } from '../../hooks/useScoreMeaning';
import { parseStrictPositiveMeasurement } from '../../logic/core/powerScoring';
import type { PhysicalProfile } from '../../types/userProfile';
import { resolveTierVisualPalette } from '../../logic/aesthetic/tierVisualPalette';
import { cn } from '../../lib/cn';
import AestheticSingleLeafTriggerButton from '../aesthetic/AestheticSingleLeafTriggerButton';
import NormBadgeChip from '../common/NormBadgeChip';
import { HeroNumberInput } from './HeroNumberInput';

export interface ExplosiveBranchCardProps {
  branch: ExplosiveBranchId;
  value: string;
  /** Display unit for length branches (cm/in); ignored for sprint. */
  lengthUnit?: string;
  /** Metric cm (jumps) or seconds (sprint) for draft flush. */
  metricValue: string;
  /** Profile for age/sex input caps on draft flush (same as tryCompute). */
  profile: PhysicalProfile | null;
  profileReady: boolean;
  inputsDisabled: boolean;
  result?: ExplosiveBranchResult;
  onChange: (value: string) => void;
  onCalculate: () => boolean;
}

const BRANCH_LABEL_KEY: Record<ExplosiveBranchId, string> = {
  verticalJump: 'explosive.branchVerticalJumpShort',
  standingLongJump: 'explosive.branchStandingLongJumpShort',
  sprint: 'explosive.branchSprintShort',
};

const BRANCH_INPUT_LABEL_KEY: Record<ExplosiveBranchId, string> = {
  verticalJump: 'explosive.verticalJumpLabel',
  standingLongJump: 'explosive.standingLongJumpLabel',
  sprint: 'explosive.sprintLabel',
};

const BRANCH_PLACEHOLDER_KEY: Record<ExplosiveBranchId, string> = {
  verticalJump: 'explosive.verticalJumpPlaceholder',
  standingLongJump: 'explosive.standingLongJumpPlaceholder',
  sprint: 'explosive.sprintPlaceholder',
};

const ExplosiveBranchCard: FC<ExplosiveBranchCardProps> = ({
  branch,
  value,
  lengthUnit = 'cm',
  metricValue,
  profile,
  profileReady,
  inputsDisabled,
  result,
  onChange,
  onCalculate,
}) => {
  const { t } = useTranslation('common');
  const leaf = EXPLOSIVE_BRANCH_TO_LEAF[branch];
  const meaning = useScoreMeaning(
    'explosivePower',
    result != null ? result.raw : null
  );
  const scorePalette = resolveTierVisualPalette(meaning?.decadeKey);
  const isSprint = branch === 'sprint';
  const inputId = `exp-branch-${branch}`;
  const inputLabel = isSprint
    ? t(BRANCH_INPUT_LABEL_KEY[branch])
    : t(BRANCH_INPUT_LABEL_KEY[branch], { unit: lengthUnit });

  return (
    <fieldset className="space-y-2 rounded-xl border border-zinc-800/80 bg-bg-panel/40 p-3">
      <legend className="text-sm font-medium text-zinc-200">
        {t(BRANCH_LABEL_KEY[branch])}
      </legend>

      <label className="flex flex-col gap-1 text-xs text-zinc-400" htmlFor={inputId}>
        <span className="font-medium text-zinc-200">{inputLabel}</span>
        {/*
          WHY type=text on sprint: specialty placeholder carries locale prose;
          number inputs truncate it (same rationale as legacy ExplosiveAssessmentPage).
        */}
        <HeroNumberInput
          id={inputId}
          type={isSprint ? 'text' : undefined}
          inputMode="decimal"
          autoComplete="off"
          min={isSprint ? undefined : 0}
          step={isSprint ? undefined : 0.1}
          className={isSprint ? 'max-w-md' : 'max-w-xs'}
          placeholder={t(BRANCH_PLACEHOLDER_KEY[branch])}
          value={value}
          disabled={inputsDisabled}
          onChange={(e) => onChange(e.target.value)}
          aria-label={inputLabel}
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid={`explosive-branch-calc-${branch}`}
          className="ui-btn ui-btn-ghost text-sm disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!profileReady || inputsDisabled}
          onClick={() => {
            if (!profileReady || inputsDisabled) return;
            onCalculate();
          }}
        >
          {t('explosive.calculateThisBranch')}
        </button>
      </div>

      {result ? (
        <div
          className="space-y-2 rounded-lg border border-zinc-700/90 bg-bg-panel/60 px-3 py-2"
          role="status"
          data-testid={`explosive-branch-result-${branch}`}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {t('explosive.branchRawScoreLabel')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'font-mono text-2xl font-bold tabular-nums',
                scorePalette.scoreTextClass,
                scorePalette.scoreGlowClass
              )}
            >
              {result.raw.toFixed(2)}
            </p>
            {meaning ? (
              <NormBadgeChip
                populationClass={meaning.populationClass}
                decadeKey={meaning.decadeKey}
                size="sm"
              />
            ) : null}
          </div>
          <AestheticSingleLeafTriggerButton
            leaf={leaf}
            disabled={inputsDisabled}
            onBeforeOpen={() => {
              const metric = parseStrictPositiveMeasurement(metricValue);
              if (metric == null) return false;
              flushExplosiveDraft({
                tab: explosiveBranchFlushTab(branch),
                verticalJumpCm: branch === 'verticalJump' ? metric : null,
                standingLongJumpCm: branch === 'standingLongJump' ? metric : null,
                sprintSeconds: branch === 'sprint' ? metric : null,
                profile,
              });
            }}
          />
        </div>
      ) : null}
    </fieldset>
  );
};

export default ExplosiveBranchCard;
