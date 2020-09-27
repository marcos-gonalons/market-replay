import React from "react";
import App from "./App";
import { mount } from "enzyme";

describe("App Component", () => {
  test("Renders the canvas component", () => {
    const app = mount(<App />);
    expect(app.find("main > Canvas").exists()).toBe(true);
  });

  test("Renders the toast container", () => {
    const app = mount(<App />);
    expect(app.find("main > ToastContainer").exists()).toBe(true);
  });
});
