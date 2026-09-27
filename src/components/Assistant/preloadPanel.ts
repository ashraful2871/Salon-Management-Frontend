// Its own module on purpose: a static import of the host from the launcher
// would put the panel back in the page bundle. The dynamic import below only
// warms the chunk that `AssistantProvider` loads on first open.
export const preloadAssistantPanel = () => {
  void import("./AssistantPanelHost");
};
