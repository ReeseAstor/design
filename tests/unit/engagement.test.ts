import { describe, expect, it } from 'vitest';
import {
  ACTIVE_TIME_THRESHOLD_SECONDS,
  isHighEngagement,
  SCROLL_DEPTH_THRESHOLD,
} from '@/lib/posthog/engagement';

describe('high-engagement threshold', () => {
  it('fires at 60% scroll depth', () => {
    expect(
      isHighEngagement({ amazonClicked: false, scrollDepth: SCROLL_DEPTH_THRESHOLD, activeTimeSeconds: 0 }),
    ).toBe(true);
  });

  it('fires at 45 seconds of active time', () => {
    expect(
      isHighEngagement({
        amazonClicked: false,
        scrollDepth: 0,
        activeTimeSeconds: ACTIVE_TIME_THRESHOLD_SECONDS,
      }),
    ).toBe(true);
  });

  it('does not fire below both thresholds', () => {
    expect(isHighEngagement({ amazonClicked: false, scrollDepth: 0.59, activeTimeSeconds: 44 })).toBe(
      false,
    );
  });

  it('never fires for a visitor who already clicked through to Amazon', () => {
    expect(
      isHighEngagement({ amazonClicked: true, scrollDepth: 1, activeTimeSeconds: 600 }),
    ).toBe(false);
  });
});
