import { patchReentry } from './reentry-patch.js';
import { patchLanding } from './landing-patch.js';

export function applyPhysicsPatches(source) {
  return patchLanding(patchReentry(source));
}
