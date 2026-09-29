import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestApi } from "@/api/api";
import ForumReportDialog from "@/components/blog-center/ForumReportDialog.vue";
import { toast } from "vue-sonner";

vi.mock("@/api/api", () => ({
  requestApi: vi.fn(),
}));

vi.mock("vue-sonner", async () => {
  const actual = await vi.importActual<typeof import("vue-sonner")>("vue-sonner");
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const requestApiMock = vi.mocked(requestApi);
const toastSuccessMock = vi.mocked(toast.success);
const toastErrorMock = vi.mocked(toast.error);

const DialogStub = defineComponent({
  name: "Dialog",
  props: {
    open: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:open"],
  template: '<div v-if="open"><slot /></div>',
});

const DialogContentStub = defineComponent({
  name: "DialogContent",
  template: "<div><slot /></div>",
});

const DialogHeaderStub = defineComponent({
  name: "DialogHeader",
  template: "<div><slot /></div>",
});

const DialogTitleStub = defineComponent({
  name: "DialogTitle",
  template: "<div><slot /></div>",
});

const DialogDescriptionStub = defineComponent({
  name: "DialogDescription",
  template: "<div><slot /></div>",
});

const DialogFooterStub = defineComponent({
  name: "DialogFooter",
  template: "<div><slot /></div>",
});

const InputStub = defineComponent({
  name: "Input",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  template: '<input class="text-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});

const TextareaStub = defineComponent({
  name: "Textarea",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
  },
  emits: ["update:modelValue"],
  template: '<textarea class="textarea-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});

const ButtonStub = defineComponent({
  name: "Button",
  emits: ["click"],
  template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
});

describe("ForumReportDialog", () => {
  beforeEach(() => {
    requestApiMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("requires a reason before submitting", async () => {
    const wrapper = mount(ForumReportDialog, {
      props: {
        modelValue: true,
        targetId: 42,
      },
      global: {
        stubs: {
          Dialog: DialogStub,
          DialogContent: DialogContentStub,
          DialogHeader: DialogHeaderStub,
          DialogTitle: DialogTitleStub,
          DialogDescription: DialogDescriptionStub,
          DialogFooter: DialogFooterStub,
          Input: InputStub,
          Textarea: TextareaStub,
          Button: ButtonStub,
        },
      },
    });

    await wrapper.findAll("button")[1].trigger("click");

    expect(requestApiMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith("请填写举报原因");
  });

  it("submits trimmed payload and closes on success", async () => {
    requestApiMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "ok" }),
    });

    const wrapper = mount(ForumReportDialog, {
      props: {
        modelValue: true,
        targetId: 42,
      },
      global: {
        stubs: {
          Dialog: DialogStub,
          DialogContent: DialogContentStub,
          DialogHeader: DialogHeaderStub,
          DialogTitle: DialogTitleStub,
          DialogDescription: DialogDescriptionStub,
          DialogFooter: DialogFooterStub,
          Input: InputStub,
          Textarea: TextareaStub,
          Button: ButtonStub,
        },
      },
    });

    const textInputs = wrapper.findAll(".text-input");
    await textInputs[0].setValue("  广告骚扰  ");
    await wrapper.find(".textarea-input").setValue("  反复发布无关内容  ");
    await wrapper.findAll("button")[1].trigger("click");
    await flushPromises();

    expect(requestApiMock).toHaveBeenCalledWith("/api/v2/forum/posts/42/report", {
      method: "POST",
      body: JSON.stringify({
        reason: "广告骚扰",
        detail: "反复发布无关内容",
      }),
    });
    expect(toastSuccessMock).toHaveBeenCalledWith("ok");
    expect(wrapper.emitted("success")).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")).toContainEqual([false]);
  });
});
