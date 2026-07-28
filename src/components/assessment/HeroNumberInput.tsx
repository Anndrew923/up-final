import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type HeroNumberInputDensity = 'default' | 'compact';

export type HeroNumberInputProps = InputHTMLAttributes<HTMLInputElement> & {
  /**
   * `compact` locks text to 2xl and skips the sm:3xl step-up.
   * WHY: Narrow columns (e.g. Cardio minutes `w-28`) overflow at 390px if sm:text-3xl wins;
   * `cn` is join-only (no twMerge), so density is a first-class prop instead of `!text-*`.
   */
  density?: HeroNumberInputDensity;
};

/**
 * Primary assessment metric field — dashboard-scale digits + brand focus ring.
 * WHY: One shared hero surface so six-axis pages share visual hierarchy without
 * mutating global `.ui-input` used by Home / Ladder / calculators.
 */
export const HeroNumberInput = forwardRef<HTMLInputElement, HeroNumberInputProps>(
  function HeroNumberInput({ className, type = 'number', density = 'default', ...rest }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'ui-input-hero',
          density === 'compact' && 'ui-input-hero--compact',
          className
        )}
        {...rest}
      />
    );
  }
);

export default HeroNumberInput;
