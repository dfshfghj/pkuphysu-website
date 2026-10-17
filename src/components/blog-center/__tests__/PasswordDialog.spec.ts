import { enableAutoUnmount, flushPromises, mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PasswordDialog from "@/components/blog-center/PasswordDialog.vue";

const mocks = vi.hoisted(() => ({ requestApi: vi.fn(), warning: vi.fn(), user: null as any }));
vi.mock("@/api/api", () => ({ requestApi: mocks.requestApi }));
vi.mock("vue-sonner", () => ({ toast: { warning: mocks.warning, error: vi.fn(), success: vi.fn() } }));
vi.mock("@/stores/user", async () => {
  const { reactive } = await import("vue");
  mocks.user = reactive({ isLoggedIn: true, userid: "1" });
  return { useUserStore: () => mocks.user };
});

type PasswordState = { checking: boolean; open: boolean };
const pendingCheck = () => {
  let resolve!: (response: any) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
const passwordResponse = (hasPassword: boolean) => ({
  ok: true,
  json: async () => ({ data: { has_password: hasPassword } }),
});
const mountDialog = (onStateChange = (_state: PasswordState) => {}) =>
  mount(PasswordDialog, {
    props: { onStateChange },
    global: {
      stubs: {
        Dialog: { props: ["open"], template: '<div v-if="open"><slot /></div>' },
        DialogContent: { template: "<div><slot /></div>" },
        DialogTitle: { template: "<h2><slot /></h2>" },
        DialogDescription: { template: "<p><slot /></p>" },
      },
    },
  });
const states = (wrapper: ReturnType<typeof mountDialog>) =>
  (wrapper.emitted("state-change") ?? []).map(([state]) => state as PasswordState);

enableAutoUnmount(afterEach);
beforeEach(() => {
  mocks.requestApi.mockReset();
  mocks.warning.mockReset();
  mocks.user.isLoggedIn = true;
  mocks.user.userid = "1";
});

describe("password dialog onboarding queue", () => {
  it("keeps the queue blocked throughout checking and opening, then releases on later setup", async () => {
    const request = pendingCheck();
    mocks.requestApi.mockReturnValueOnce(request.promise);
    const wrapper = mountDialog();
    await nextTick();
    expect(mocks.requestApi).toHaveBeenCalledWith("/api/v2/user/me");
    expect(states(wrapper)).toEqual([{ checking: true, open: false }]);

    request.resolve(passwordResponse(false));
    await flushPromises();
    // There must be no transient unblocked state before the password dialog opens.
    expect(states(wrapper)).toEqual([
      { checking: true, open: false },
      { checking: false, open: true },
    ]);
    const later = wrapper.findAll("button").find((button) => button.text() === "稍后设置");
    expect(later).toBeDefined();
    await later!.trigger("click");
    expect(states(wrapper).at(-1)).toEqual({ checking: false, open: false });
  });

  it("releases the queue for an account that already has a password", async () => {
    mocks.requestApi.mockResolvedValueOnce(passwordResponse(true));
    const wrapper = mountDialog();
    await flushPromises();
    expect(states(wrapper)).toEqual([
      { checking: true, open: false },
      { checking: false, open: false },
    ]);
    expect(mocks.warning).not.toHaveBeenCalled();
  });

  it("releases the queue after a failed password check", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.requestApi.mockRejectedValueOnce(new Error("offline"));
      const wrapper = mountDialog();
      await flushPromises();
      expect(states(wrapper)).toEqual([
        { checking: true, open: false },
        { checking: false, open: false },
      ]);
    } finally {
      error.mockRestore();
    }
  });

  it("does not let the previous account response open or unblock the current account check", async () => {
    const oldAccount = pendingCheck();
    const currentAccount = pendingCheck();
    mocks.requestApi.mockReturnValueOnce(oldAccount.promise).mockReturnValueOnce(currentAccount.promise);
    const wrapper = mountDialog();
    mocks.user.userid = "2";
    await nextTick();
    expect(mocks.requestApi).toHaveBeenCalledTimes(2);
    oldAccount.resolve(passwordResponse(false));
    await flushPromises();
    expect(states(wrapper)).toEqual([{ checking: true, open: false }]);
    expect(mocks.warning).not.toHaveBeenCalled();
    currentAccount.resolve(passwordResponse(true));
    await flushPromises();
    expect(states(wrapper).at(-1)).toEqual({ checking: false, open: false });
  });

  it("atomically replaces an open dialog with the next account check", async () => {
    const currentAccount = pendingCheck();
    mocks.requestApi.mockResolvedValueOnce(passwordResponse(false)).mockReturnValueOnce(currentAccount.promise);
    const wrapper = mountDialog();
    await flushPromises();
    mocks.user.userid = "2";
    await nextTick();
    expect(states(wrapper)).toEqual([
      { checking: true, open: false },
      { checking: false, open: true },
      { checking: true, open: false },
    ]);
    currentAccount.resolve(passwordResponse(true));
    await flushPromises();
    expect(states(wrapper).at(-1)).toEqual({ checking: false, open: false });
  });

  it("ignores a pending response after unmount", async () => {
    const request = pendingCheck();
    mocks.requestApi.mockReturnValueOnce(request.promise);
    const onStateChange = vi.fn();
    const wrapper = mountDialog(onStateChange);
    await nextTick();
    const beforeUnmount = onStateChange.mock.calls.length;
    wrapper.unmount();
    request.resolve(passwordResponse(false));
    await flushPromises();
    expect(onStateChange).toHaveBeenCalledTimes(beforeUnmount);
    expect(mocks.warning).not.toHaveBeenCalled();
  });

  it("releases the queue without a request when logged out", async () => {
    mocks.user.isLoggedIn = false;
    const wrapper = mountDialog();
    await flushPromises();
    expect(mocks.requestApi).not.toHaveBeenCalled();
    expect(states(wrapper).at(-1)).toEqual({ checking: false, open: false });
  });
});
