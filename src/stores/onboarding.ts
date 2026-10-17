import { defineStore } from "pinia";
import { ref } from "vue";

type OnboardingPhase = "idle" | "available";
type OnboardingRecord = "skipped" | "completed";

export const useOnboardingStore = defineStore("onboarding", () => {
  const accountId = ref<string | null>(null);
  const phase = ref<OnboardingPhase>("idle");
  // Keep handled accounts in memory when browser storage is unavailable.
  const handledAccounts = new Set<string>();

  function identify(id: string | null) {
    if (id === accountId.value) return;
    accountId.value = id;
    phase.value = "idle";
    if (!id) return;
    try {
      const record = localStorage.getItem(`onboarding:v1:${id}`);
      if (record === "skipped" || record === "completed") handledAccounts.add(id);
    } catch {
      // Disabled storage must not prevent browsing or starting the tutorial.
    }
  }

  function remember(record: OnboardingRecord) {
    const id = accountId.value;
    if (!id) return;
    handledAccounts.add(id);
    try {
      localStorage.setItem(`onboarding:v1:${id}`, record);
    } catch {
      // The session record above still prevents repeated prompts.
    }
  }

  function offer() {
    const id = accountId.value;
    if (!id || phase.value !== "idle" || handledAccounts.has(id)) return;
    handledAccounts.add(id);
    phase.value = "available";
  }

  function start() {
    if (!accountId.value) return;
    // Entering the tutorial only suppresses the current session's prompt; an
    // unfinished tutorial should be offered again after a refresh.
    handledAccounts.add(accountId.value);
    phase.value = "idle";
  }

  function dismiss() {
    if (!accountId.value) return;
    remember("skipped");
    phase.value = "idle";
  }

  function complete() {
    if (!accountId.value) return;
    remember("completed");
    phase.value = "idle";
  }

  return { accountId, phase, identify, offer, start, dismiss, complete, replay: start };
});
