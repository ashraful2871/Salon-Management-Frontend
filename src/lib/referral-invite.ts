import type { InviteCardData } from "@/components/Referral/InviteCard";
import { shareMessageOf } from "@/lib/referral-view";
import { getMyReferral } from "@/services/referral/getMyReferral";
import { getPublicSettings, referralSettingsOf } from "@/services/settings/getPublicSettings";

/**
 * Server only. The "Enjoyed booking?" card's data for a booking confirmation,
 * or null: not a customer, the program is off (the public settings are read
 * first, so no code is made while it is), the code is blocked, or a read failed.
 */
export const inviteCardFor = async (role: string | null | undefined): Promise<InviteCardData | null> => {
  if (role !== "CUSTOMER") return null;
  const settings = await getPublicSettings();
  if (!referralSettingsOf(settings.success ? settings.data : null)["referral.enabled"]) return null;

  const res = await getMyReferral();
  const me = res.success ? res.data : null;
  if (!me || !me.programOn || me.blocked) return null;
  return {
    link: me.link,
    message: shareMessageOf(me),
    friendPercent: me.terms.friend.percent,
    youPercent: me.terms.you.percent,
  };
};
