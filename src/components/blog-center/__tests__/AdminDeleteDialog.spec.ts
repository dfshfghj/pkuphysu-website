import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, expect, it, vi } from "vitest";
import AdminDeleteDialog from "@/components/blog-center/AdminDeleteDialog.vue";

const { requestApi } = vi.hoisted(() => ({ requestApi: vi.fn() }));
vi.mock("@/api/api", () => ({ requestApi }));
vi.mock("vue-sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
beforeEach(() => requestApi.mockReset());

it("runs the captured cache update once even when unmounted during deletion", async () => {
  let finish!: (value: unknown) => void;
  requestApi.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  const afterDelete = vi.fn();
  const wrapper = mount(AdminDeleteDialog, {
    props: {
      modelValue: true,
      endpoint: "/api/v2/forum/posts/7",
      title: "删除帖子",
      description: "删除",
      successMessage: "已删除",
      afterDelete,
    },
    global: {
      stubs: Object.fromEntries(
        ["Dialog", "DialogContent", "DialogDescription", "DialogFooter", "DialogHeader", "DialogTitle"].map((name) => [
          name,
          { template: "<div><slot /></div>" },
        ])
      ),
    },
  });
  const button = wrapper.findAll("button").find((button) => button.text() === "确认删除")!;
  await button.trigger("click");
  expect(button.attributes("disabled")).toBeDefined();
  wrapper.unmount();
  finish({ ok: true, json: async () => ({ message: "已删除" }) });
  await flushPromises();
  expect(afterDelete).toHaveBeenCalledTimes(1);
  expect(requestApi).toHaveBeenCalledTimes(1);
});
