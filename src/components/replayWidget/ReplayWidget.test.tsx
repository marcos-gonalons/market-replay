import React from "react";
import ReplayWidget from "./ReplayWidget";
import { mount } from "enzyme";

describe("Replay Widget Component", () => {
  test("Renders", () => {
    const replayWidget = mount(<ReplayWidget />);
    expect(replayWidget.exists()).toBe(true);
  });
});
