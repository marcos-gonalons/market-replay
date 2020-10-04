import React from "react";
import FileSelector from "./FileSelector";
import { mount } from "enzyme";

describe("File Selector Component", () => {
  test("Renders the input element", () => {
    const fileSelector = mount(<FileSelector />);
    expect(fileSelector.find("input[type='file']").exists()).toBe(true);
  });
});
