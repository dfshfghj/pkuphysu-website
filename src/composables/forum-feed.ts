import { computed, onActivated, onDeactivated, onMounted, ref, watch } from "vue";
import { useForumStore, type FeedKey } from "@/stores/forum";

export function useForumFeed(key: FeedKey, config: () => { query?: string[]; tag?: string }, scrollToTop: () => void) {
  const store = useForumStore();
  const active = ref(true);
  const feed = computed(() => store.feeds[key]);
  const posts = computed(() => store.feedPosts(key));
  const refresh = async (force = false) => {
    if (key === "search" && !config().query?.length) return;
    if (force) {
      await store.fetchFeed(key, config());
      if (!feed.value.error) scrollToTop();
    } else {
      await store.ensureFeed(key, config());
    }
  };
  const loadMorePosts = () => {
    if (key === "search" && !config().query?.length) return;
    return store.fetchFeed(key, config(), true);
  };
  onMounted(() => refresh());
  onActivated(() => {
    active.value = true;
    refresh();
  });
  onDeactivated(() => {
    active.value = false;
  });
  watch(
    () => feed.value.dirty,
    (dirty) => {
      if (dirty && active.value) refresh();
    }
  );
  return { feed, posts, refresh, loadMorePosts };
}
