<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { useUserStore } from "@/stores/user";
import { useOnboardingStore } from "@/stores/onboarding";

const props = defineProps<{ blocked?: boolean }>();
const user = useUserStore();
const route = useRoute();
const router = useRouter();
const onboarding = useOnboardingStore();
const mounted = ref(false);
const ready = computed(() => mounted.value && user.isLoggedIn && route.name === "PostsView" && !props.blocked);
type Offer = { account: string; id?: string | number };
let activeOffer: Offer | null = null;

function withdraw() {
  const previous = activeOffer;
  // Invalidate callbacks before dismissing: programmatic dismissal is not a skip.
  activeOffer = null;
  if (previous?.id !== undefined) toast.dismiss(previous.id);
}

watch(
  () => (user.isLoggedIn && user.userid ? String(user.userid) : null),
  (id) => {
    withdraw();
    onboarding.identify(id);
  },
  { immediate: true, flush: "sync" }
);

function showOffer(account: string) {
  const offer: Offer = { account };
  activeOffer = offer;
  const isCurrent = () => activeOffer === offer && ready.value && onboarding.accountId === account;
  const skip = () => {
    if (!isCurrent()) return;
    withdraw();
    onboarding.dismiss();
  };
  offer.id = toast("引导教程可用", {
    duration: 8000,
    action: {
      label: "查看教程",
      onClick: () => {
        if (!isCurrent()) return;
        withdraw();
        onboarding.start();
        void router.push({ name: "EditorGuide" });
      },
    },
    cancel: { label: "跳过", onClick: skip },
    onDismiss: skip,
    onAutoClose: skip,
  });
}

watch(
  [ready, () => onboarding.accountId, () => onboarding.phase],
  () => {
    if (!ready.value || !onboarding.accountId) {
      withdraw();
      return;
    }
    onboarding.offer();
    if (onboarding.phase === "available") {
      if (!activeOffer) showOffer(onboarding.accountId);
    } else withdraw();
  },
  { immediate: true }
);
onMounted(() => {
  mounted.value = true;
});
onBeforeUnmount(() => {
  mounted.value = false;
  withdraw();
});
</script>

<template></template>
