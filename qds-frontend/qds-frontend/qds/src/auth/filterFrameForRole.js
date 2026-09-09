/**
 * HISTORICAL NOTE: this used to do client-side filtering of ROUND_UPDATE
 * fields per role, before a real session server existed. That filtering
 * now happens server-side (see filterFrameForAccountType in
 * server/index.js), which is the correct place for it — a client-side
 * filter is not a security boundary, since anyone could read the
 * unfiltered frame straight off their own network tab.
 *
 * This is kept as a no-op pass-through only so nothing breaks if some
 * caller still imports it; nothing in the app calls it anymore. Safe to
 * delete once you've confirmed that.
 */
export function filterFrameForRole(fullFrame) {
  return fullFrame;
}
