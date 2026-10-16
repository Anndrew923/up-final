/**
 * Ultimate Physique — Cloud Functions entry (feature re-exports only).
 */
import { setGlobalOptions } from "firebase-functions/v2/options";
import { CALLABLE_OPTS } from "./shared/constants.js";

setGlobalOptions({
  region: CALLABLE_OPTS.region,
  memory: CALLABLE_OPTS.memory,
  timeoutSeconds: CALLABLE_OPTS.timeoutSeconds,
});

export { ladderSubmitShard } from "./ladder/submitShard.js";
export { ladderSyncPreview } from "./ladder/syncPreviewCallable.js";
export { ladderSyncBatch } from "./ladder/syncBatchCallable.js";
export { ladderWithdrawPublicPresence } from "./ladder/withdrawPublicPresenceCallable.js";
export { ladderReportUser } from "./ladder/reportUserCallable.js";
export {
  getAdminLadderReports,
  processLadderReport,
} from "./ladder/adminReportsCallable.js";
export {
  lookupAdminLadderUser,
  adminRemoveFromLadder,
  adminDeleteUser,
} from "./ladder/adminUserOpsCallable.js";
export { dynoIntelChat } from "./dynoIntel/chatCallable.js";
export { syncProSubscription } from "./subscription/syncProCallable.js";
export { redeemPromoCode } from "./subscription/redeemPromoCallable.js";
export { revenueCatWebhook } from "./subscription/revenueCatWebhook.js";
export { deleteAccount } from "./account/deleteAccountCallable.js";
export { createGuild } from "./guild/createGuildCallable.js";
export { joinGuild } from "./guild/joinGuildCallable.js";
export { leaveGuild } from "./guild/leaveGuildCallable.js";
export { kickGuildMember } from "./guild/kickMemberCallable.js";
export { renameGuild } from "./guild/renameGuildCallable.js";
export { disbandGuild } from "./guild/disbandGuildCallable.js";
export { syncGuildLadderScore } from "./guild/syncGuildScoreCallable.js";
