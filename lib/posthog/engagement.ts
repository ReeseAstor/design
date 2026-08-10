/**
 * Engagement threshold for the newsletter recovery offer.
 *
 * The definition is deliberately narrow: a reader who already clicked through to
 * Amazon is not a recovery candidate, and we would rather miss a marginal
 * signup than interrupt someone on their way to buying.
 */

export const SCROLL_DEPTH_THRESHOLD = 0.6;
export const ACTIVE_TIME_THRESHOLD_SECONDS = 45;

export interface EngagementState {
  amazonClicked: boolean;
  scrollDepth: number;
  activeTimeSeconds: number;
}

export function isHighEngagement(state: EngagementState): boolean {
  const highEngagement =
    !state.amazonClicked &&
    (state.scrollDepth >= SCROLL_DEPTH_THRESHOLD ||
      state.activeTimeSeconds >= ACTIVE_TIME_THRESHOLD_SECONDS);

  return highEngagement;
}
