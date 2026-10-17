import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Action, ExternalToast, ToastT } from "vue-sonner";
import OnboardingGuide from "@/components/blog-center/OnboardingGuide.vue";
import { useOnboardingStore } from "@/stores/onboarding";

const mocks = vi.hoisted(() => ({
  user: null as any,
  route: null as any,
  toast: vi.fn(),
  dismiss: vi.fn(),
  push: vi.fn(),
}));
vi.mock("vue-sonner", () => ({ toast: Object.assign(mocks.toast, { dismiss: mocks.dismiss }) }));
vi.mock("@/stores/user", async () => {
  const { reactive } = await import("vue");
  mocks.user = reactive({ userid: "1", isLoggedIn: true });
  return { useUserStore: () => mocks.user };
});
vi.mock("vue-router", async () => {
  const { reactive } = await import("vue");
  mocks.route = reactive({ name: "PostsView" });
  return { useRoute: () => mocks.route, useRouter: () => ({ push: mocks.push }) };
});
enableAutoUnmount(afterEach);
beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  mocks.toast.mockReset().mockImplementation(() => mocks.toast.mock.calls.length);
  mocks.dismiss.mockReset();
  mocks.push.mockReset();
  mocks.user.userid = "1";
  mocks.user.isLoggedIn = true;
  mocks.route.name = "PostsView";
});
const mountGuide = (blocked = false) => mount(OnboardingGuide, { props: { blocked } });
const options = (index = 0) => mocks.toast.mock.calls[index]![1] as ExternalToast;
const click = (action: ExternalToast["action"]) => (action as Action).onClick(new MouseEvent("click"));
const toastEvent = { id: 1 } as ToastT;

it("offers a nonmodal toast only on the homepage after password checks settle", async () => {
  mocks.route.name = "CommentsView";
  const wrapper = mountGuide(true);
  await flushPromises();
  expect(mocks.toast).not.toHaveBeenCalled();
  mocks.route.name = "PostsView";
  await flushPromises();
  expect(mocks.toast).not.toHaveBeenCalled();
  await wrapper.setProps({ blocked: false });
  expect(mocks.toast).toHaveBeenCalledWith("引导教程可用", expect.objectContaining({ duration: 8000 }));
  expect(wrapper.find("[role=dialog]").exists()).toBe(false);
  expect(mocks.push).not.toHaveBeenCalled();
});

it("navigates only on action and leaves an unfinished tutorial unhandled", async () => {
  mountGuide();
  await flushPromises();
  const initial = options();
  expect((initial.action as Action).label).toBe("查看教程");
  click(initial.action);
  initial.onDismiss?.(toastEvent);
  initial.onAutoClose?.(toastEvent);
  expect(mocks.push).toHaveBeenCalledExactlyOnceWith({ name: "EditorGuide" });
  expect(localStorage.getItem("onboarding:v1:1")).toBeNull();
  expect(useOnboardingStore().phase).toBe("idle");
});

it("offers again after a refresh when the tutorial was not completed", async () => {
  const wrapper = mountGuide();
  await flushPromises();
  click(options().action);
  mocks.route.name = "EditorGuide";
  await flushPromises();
  mocks.route.name = "PostsView";
  await flushPromises();
  expect(mocks.toast).toHaveBeenCalledTimes(1);

  wrapper.unmount();
  setActivePinia(createPinia());
  mountGuide();
  await flushPromises();
  expect(mocks.toast).toHaveBeenCalledTimes(2);
});

it.each(["cancel", "onDismiss", "onAutoClose"] as const)("records %s as skipped and never repeats", async (event) => {
  mountGuide();
  await flushPromises();
  const initial = options();
  if (event === "cancel") click(initial.cancel);
  else initial[event]?.(toastEvent);
  await flushPromises();
  expect(localStorage.getItem("onboarding:v1:1")).toBe("skipped");
  expect(mocks.push).not.toHaveBeenCalled();
  mocks.route.name = "CommentsView";
  await flushPromises();
  mocks.route.name = "PostsView";
  await flushPromises();
  expect(mocks.toast).toHaveBeenCalledTimes(1);
});

it("withdraws off-route toasts and ignores callbacks from the withdrawn toast", async () => {
  mountGuide();
  await flushPromises();
  const initial = options();
  mocks.route.name = "CommentsView";
  await flushPromises();
  expect(mocks.dismiss).toHaveBeenCalledWith(1);
  click(initial.action);
  initial.onDismiss?.(toastEvent);
  expect(mocks.push).not.toHaveBeenCalled();
  expect(localStorage.getItem("onboarding:v1:1")).toBeNull();
  mocks.route.name = "PostsView";
  await flushPromises();
  expect(mocks.toast).toHaveBeenCalledTimes(2);
});

it("withdraws blocked toasts and restores the available prompt after unblocking", async () => {
  const wrapper = mountGuide();
  await flushPromises();
  await wrapper.setProps({ blocked: true });
  expect(mocks.dismiss).toHaveBeenCalledWith(1);
  options().onAutoClose?.(toastEvent);
  expect(localStorage.getItem("onboarding:v1:1")).toBeNull();
  await wrapper.setProps({ blocked: false });
  expect(mocks.toast).toHaveBeenCalledTimes(2);
});

it("isolates old callbacks on account changes and hides toasts on logout", async () => {
  mountGuide();
  await flushPromises();
  const initial = options();
  mocks.user.userid = "2";
  click(initial.action);
  initial.onDismiss?.(toastEvent);
  await flushPromises();
  expect(mocks.dismiss).toHaveBeenCalledWith(1);
  expect(mocks.toast).toHaveBeenCalledTimes(2);
  click(initial.action);
  click(initial.cancel);
  initial.onAutoClose?.(toastEvent);
  expect(mocks.push).not.toHaveBeenCalled();
  expect(localStorage.getItem("onboarding:v1:2")).toBeNull();
  click(options(1).cancel);
  expect(localStorage.getItem("onboarding:v1:2")).toBe("skipped");
  mocks.user.isLoggedIn = false;
  await flushPromises();
  expect(useOnboardingStore().accountId).toBeNull();
});

it("withdraws an active toast immediately on logout", async () => {
  mountGuide();
  await flushPromises();
  const initial = options();
  mocks.user.isLoggedIn = false;
  click(initial.action);
  await flushPromises();
  expect(mocks.dismiss).toHaveBeenCalledWith(1);
  expect(mocks.push).not.toHaveBeenCalled();
  expect(localStorage.getItem("onboarding:v1:1")).toBeNull();
  expect(useOnboardingStore().accountId).toBeNull();
});

it("withdraws its toast on unmount and ignores pending callbacks", async () => {
  const wrapper = mountGuide();
  await flushPromises();
  const initial = options();
  wrapper.unmount();
  expect(mocks.dismiss).toHaveBeenCalledWith(1);
  click(initial.action);
  initial.onAutoClose?.(toastEvent);
  expect(mocks.push).not.toHaveBeenCalled();
  expect(localStorage.getItem("onboarding:v1:1")).toBeNull();
});
