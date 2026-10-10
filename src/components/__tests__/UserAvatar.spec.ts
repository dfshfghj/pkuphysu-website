import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import UserAvatar from "@/components/UserAvatar.vue";

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ userid: 1 }),
}));

const srcFor = (props: Record<string, unknown> = {}) => {
  const wrapper = mount(UserAvatar, { props: { userid: 35, ...props } });
  return wrapper.find("img").attributes("src")!;
};

describe("UserAvatar", () => {
  it("按显示尺寸向上取到最近的尺寸档", () => {
    expect(srcFor({ size: 28 })).toContain("?size=32");
    expect(srcFor({ size: 40 })).toContain("?size=48");
    expect(srcFor({ size: 50 })).toContain("?size=64");
    expect(srcFor({ size: 60 })).toContain("?size=64");
    expect(srcFor({ size: 70 })).toContain("?size=96");
    expect(srcFor({ size: 72 })).toContain("?size=96");
    expect(srcFor({ size: 120 })).toContain("?size=128");
  });

  it("默认尺寸 40 取 48 档", () => {
    expect(srcFor()).toContain("?size=48");
  });

  it("超出最大档时钳制到最大档", () => {
    expect(srcFor({ size: 400 })).toContain("?size=256");
  });

  it("图片使用懒加载与异步解码", () => {
    const wrapper = mount(UserAvatar, { props: { userid: 35 } });
    const img = wrapper.find("img");
    expect(img.attributes("loading")).toBe("lazy");
    expect(img.attributes("decoding")).toBe("async");
  });

  it("未传 userid 时回退到当前登录用户", () => {
    expect(srcFor({ userid: "" })).toContain("/api/v2/user/avatar/1");
  });
});
