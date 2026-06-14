/* @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../../../i18n';
import AssessmentReferenceDisclosure from '../AssessmentReferenceDisclosure';
import {
  ASSESSMENT_REFERENCE_PANEL_BODY_CLASS,
  ReferenceDataBlock,
  ReferenceDataList,
  ReferenceFootnote,
  ReferenceLead,
  ReferenceSimpleCopy,
} from '../AssessmentReferenceProse';
import { ExplosiveReferencePanel } from '../ExplosiveReferencePanel';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function renderWithI18n(node: ReactNode): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(<I18nextProvider i18n={i18n}>{node}</I18nextProvider>);
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('AssessmentReferenceProse', () => {
  it('applies shared lead and footnote typography', () => {
    const { container, unmount } = renderWithI18n(
      <>
        <ReferenceLead data-testid="lead">Lead</ReferenceLead>
        <ReferenceFootnote data-testid="footnote">Footnote</ReferenceFootnote>
      </>,
    );

    const lead = container.querySelector('[data-testid="lead"]');
    const footnote = container.querySelector('[data-testid="footnote"]');
    expect(lead?.className).toContain('font-medium');
    expect(lead?.className).toContain('text-zinc-200');
    expect(footnote?.className).toContain('text-zinc-500');
    unmount();
  });

  it('renders body paragraphs and a trailing footnote', () => {
    const { container, unmount } = renderWithI18n(
      <ReferenceSimpleCopy paragraphs={['A', 'B']} footnote="C" />,
    );

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[2]?.className).toContain('text-zinc-500');
    unmount();
  });

  it('wraps anchor rows in a bordered data block with mono list', () => {
    const { container, unmount } = renderWithI18n(
      <ReferenceDataBlock data-testid="block">
        <ReferenceDataList>
          <li>42</li>
        </ReferenceDataList>
      </ReferenceDataBlock>,
    );

    const block = container.querySelector('[data-testid="block"]');
    expect(block?.className).toContain('rounded-lg');
    expect(block?.className).toContain('border');
    expect(container.querySelector('.font-mono')).toBeTruthy();
    unmount();
  });
});

describe('AssessmentReferenceDisclosure', () => {
  it('uses the shared assessment reference panel body class', () => {
    const { container, unmount } = renderWithI18n(
      <AssessmentReferenceDisclosure
        instanceId="test-reference"
        expanded
        onToggle={() => undefined}
      >
        <p>Body</p>
      </AssessmentReferenceDisclosure>,
    );

    const body = container.querySelector(`#test-reference-panel > div`);
    expect(body?.className).toBe(ASSESSMENT_REFERENCE_PANEL_BODY_CLASS);
    unmount();
  });
});

describe('ExplosiveReferencePanel', () => {
  it('renders anchor data block when norms are available', () => {
    const { container, unmount } = renderWithI18n(
      <ExplosiveReferencePanel
        anchorsFallback={null}
        powerNormAnchors={{
          ageRange: '21-30',
          vjump: { 0: 40, 50: 55, 100: 70 },
          slj: { 0: 200, 50: 240, 100: 280 },
          sprint: { 0: 5.2, 50: 4.8, 100: 4.4 },
        }}
      />,
    );

    expect(container.querySelector('.font-mono')).toBeTruthy();
    expect(container.querySelector('.rounded-lg.border')).toBeTruthy();
    unmount();
  });

  it('renders profile incomplete footnote when fallback says so', () => {
    const { container, unmount } = renderWithI18n(
      <ExplosiveReferencePanel
        powerNormAnchors={null}
        anchorsFallback="profile_incomplete"
      />,
    );

    expect(container.querySelector('.text-amber-100\\/90')).toBeNull();
    expect(container.querySelectorAll('.text-zinc-500').length).toBeGreaterThan(0);
    unmount();
  });

  it('renders age-out-of-range callout when fallback says so', () => {
    const { container, unmount } = renderWithI18n(
      <ExplosiveReferencePanel powerNormAnchors={null} anchorsFallback="age_out_of_range" />,
    );

    expect(container.querySelector('[class*="text-amber-100"]')).toBeTruthy();
    unmount();
  });
});
