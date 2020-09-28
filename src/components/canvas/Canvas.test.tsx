import React from "react";
import Canvas, { Props } from "./Canvas";
import { mount } from "enzyme";

describe("Canvas Component", () => {
  let defaultProps: Props;

  beforeEach(() => {
    defaultProps = {
      setIsParsingDataCallback: jest.fn(),
    };
  });

  test("Renders the canvas container", () => {
    const canvas = mount(<Canvas {...defaultProps} />);
    expect(canvas.find("div#canvas-container").exists()).toBe(true);
  });

  test("Renders the canvas inside the container", () => {
    const canvas = mount(<Canvas {...defaultProps} />);
    expect(canvas.find("div#canvas-container > canvas").exists()).toBe(true);
  });
});
