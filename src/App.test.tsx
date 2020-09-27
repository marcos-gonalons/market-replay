import React from "react";
import App from "./App";
import { mount } from "enzyme";

describe("App Component", () => {
  test("Renders the canvas container", () => {
    const app = mount(<App />);
    expect(app.find("main > div#canvas-container").exists()).toBe(true);
  });

  test("Renders the canvas inside the container", () => {
    const app = mount(<App />);
    expect(app.find("main > div#canvas-container > canvas").exists()).toBe(true);
  });
});
