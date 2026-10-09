import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";
import PollComposerDialog from "@/components/blog-center/PollComposerDialog.vue";

const passthrough = (name: string) => defineComponent({ name, template: "<div><slot /></div>" });

const dialogStubs = {
  Dialog: defineComponent({
    name: "Dialog",
    props: { open: { type: Boolean, default: false } },
    template: '<div v-if="open" class="dialog-stub"><slot /></div>',
  }),
  DialogContent: passthrough("DialogContent"),
  DialogHeader: passthrough("DialogHeader"),
  DialogTitle: passthrough("DialogTitle"),
  DialogFooter: passthrough("DialogFooter"),
};

const mountDialog = () =>
  mount(PollComposerDialog, { props: { visible: true }, global: { stubs: dialogStubs } });

const optionInputs = (wrapper: ReturnType<typeof mountDialog>) => wrapper.findAll(".poll-option-row input");
const confirmButton = (wrapper: ReturnType<typeof mountDialog>) =>
  wrapper.findAll("button").find((button) => button.text() === "确定")!;

describe("PollComposerDialog", () => {
  it("默认两个空选项，确定按钮禁用", () => {
    const wrapper = mountDialog();
    expect(optionInputs(wrapper)).toHaveLength(2);
    expect(confirmButton(wrapper).attributes("disabled")).toBeDefined();
  });

  it("只填一个选项时不能确定", async () => {
    const wrapper = mountDialog();
    await optionInputs(wrapper)[0].setValue("甲");
    expect(confirmButton(wrapper).attributes("disabled")).toBeDefined();
  });

  it("填满两个选项后确定，发出单选配置", async () => {
    const wrapper = mountDialog();
    await optionInputs(wrapper)[0].setValue("甲");
    await optionInputs(wrapper)[1].setValue("乙");

    expect(confirmButton(wrapper).attributes("disabled")).toBeUndefined();
    await confirmButton(wrapper).trigger("click");

    expect(wrapper.emitted("confirm")).toEqual([[{ multiple: false, options: ["甲", "乙"] }]]);
    expect(wrapper.emitted("update:visible")).toEqual([[false]]);
  });

  it("可添加与删除选项", async () => {
    const wrapper = mountDialog();
    await wrapper.find(".poll-add").trigger("click");
    expect(optionInputs(wrapper)).toHaveLength(3);

    await wrapper.find(".poll-remove").trigger("click");
    expect(optionInputs(wrapper)).toHaveLength(2);
  });

  it("勾选允许多选后配置带上 multiple", async () => {
    const wrapper = mountDialog();
    await wrapper.find(".poll-multiple input").setValue(true);
    await optionInputs(wrapper)[0].setValue("甲");
    await optionInputs(wrapper)[1].setValue("乙");
    await confirmButton(wrapper).trigger("click");

    expect(wrapper.emitted("confirm")).toEqual([[{ multiple: true, options: ["甲", "乙"] }]]);
  });
});
