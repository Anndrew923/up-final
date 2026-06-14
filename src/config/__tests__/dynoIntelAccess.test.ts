import { afterEach, describe, expect, it, vi } from 'vitest';

describe('dynoIntelAccess', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('keeps bypass off in production without beta flag', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_DYNO_INTEL_BETA_FREE', '');
    const { isDynoIntelProBypassActive } = await import('../dynoIntelAccess');
    expect(isDynoIntelProBypassActive()).toBe(false);
  });

  it('allows bypass in production when beta flag is baked in', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_DYNO_INTEL_BETA_FREE', 'true');
    const { isDynoIntelProBypassActive } = await import('../dynoIntelAccess');
    expect(isDynoIntelProBypassActive()).toBe(true);
  });

  it('allows bypass in dev without beta flag', async () => {
    vi.stubEnv('PROD', false);
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_DYNO_INTEL_BETA_FREE', '');
    const { isDynoIntelProBypassActive } = await import('../dynoIntelAccess');
    expect(isDynoIntelProBypassActive()).toBe(true);
  });
});
