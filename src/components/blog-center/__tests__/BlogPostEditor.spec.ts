import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BlogPostEditor from "@/components/blog-center/BlogPostEditor.vue";
import { useForumStore, type Post } from "@/stores/forum";

const { requestApi } = vi.hoisted(() => ({ requestApi: vi.fn() }));
vi.mock("@/api/api", () => ({ requestApi }));
const response = (data: unknown) => ({ ok: true, json: async () => ({ data }) });
beforeEach(() => {
  setActivePinia(createPinia());
  requestApi.mockReset().mockResolvedValue(response([]));
});

const passthrough = (name: string) => defineComponent({ name, template: "<div><slot /></div>" });
const stub = (name: string) => defineComponent({ name, template: "<div />" });

const stubs = {
  MarkdownEditor: stub("MarkdownEditor"),
  AutoCompleteTagInput: stub("AutoCompleteTagInput"),
  QuotePostDialog: stub("QuotePostDialog"),
  Button: stub("Button"),
  "el-icon": passthrough("ElIcon"),
  Close: stub("Close"),
};

const mountUnderParent = (parentScopeId: string) => {
  const Host = defineComponent({
    __scopeId: parentScopeId,
    render: () => h(BlogPostEditor, { visible: true }),
  } as never);

  return mount(Host as never, { global: { stubs } });
};

describe("BlogPostEditor 根节点结构", () => {
  it("保持单根，父组件的 scopeId 才会落到根元素上", () => {
    const scopeId = "data-v-parent-scope";
    const wrapper = mountUnderParent(scopeId);

    expect((wrapper.element as Element).hasAttribute(scopeId)).toBe(true);
  });
});

describe("post mutation synchronization", () => {
  const mountEditing = () =>
    mount(BlogPostEditor, {
      props: { visible: true, editTarget: { id: 7, content: "edited", tags: [] } },
      global: { stubs: { ...stubs, Button: passthrough("Button") } },
    });

  it("synchronizes edited posts even after leaving the page before PUT completes", async () => {
    const store = useForumStore();
    store.upsertPosts([{ id: 7, text: "old" } as Post]);
    store.feeds.home.ids = [7];
    let finish!: (value: ReturnType<typeof response>) => void;
    requestApi.mockImplementation((url: string, options?: { method?: string }) => {
      if (options?.method === "PUT")
        return new Promise((resolve) => {
          finish = resolve;
        });
      return Promise.resolve(response(url.includes("tags") ? [] : { id: 7, text: "edited" }));
    });
    const wrapper = mountEditing();
    await wrapper.findComponent({ name: "Button" }).trigger("click");
    wrapper.unmount();
    finish(response(null));
    await flushPromises();
    expect(store.posts[0].text).toBe("edited");
    expect(store.feeds.home.ids).toEqual([7]);
    expect(store.feeds.search.dirty).toBe(true);
  });

  it("does not synchronize an old account's completed edit into a new session", async () => {
    const store = useForumStore();
    let finish!: (value: ReturnType<typeof response>) => void;
    requestApi.mockImplementation((_url: string, options?: { method?: string }) =>
      options?.method === "PUT"
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : Promise.resolve(response([]))
    );
    const wrapper = mountEditing();
    await wrapper.findComponent({ name: "Button" }).trigger("click");
    store.resetSession();
    finish(response(null));
    await flushPromises();
    expect(store.postsById).toEqual({});
    expect(store.dirtyPostIds).toEqual([]);
    expect(requestApi).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });
});
