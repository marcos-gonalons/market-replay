import React from "react";
import Canvas from "./Canvas";
import { mount } from "enzyme";

describe("Canvas Component", () => {
  test("Renders the canvas container", () => {
    const canvas = mount(<Canvas />);
    expect(canvas.find("div#canvas-container").exists()).toBe(true);
  });

  test("Renders the canvas inside the container", () => {
    const canvas = mount(<Canvas />);
    expect(canvas.find("div#canvas-container > canvas").exists()).toBe(true);
  });
});
