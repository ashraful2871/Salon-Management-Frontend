"use server";

import { getAdminInbox } from "./getAdminInbox";

/**
 * The bell re-reads the inbox when it opens: the dashboard layout that
 * fetched it first is not re-rendered by client navigation.
 */
export const loadAdminInbox = async () => getAdminInbox();
