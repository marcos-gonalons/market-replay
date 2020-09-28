import React from "react";
import FileSelector, { Props } from "./FileSelector";
import { mount } from "enzyme";
import { toast as toastMockery } from "react-toastify";

describe("File Selector Component", () => {
  let defaultProps: Props;

  beforeEach(() => {
    defaultProps = {
      setDataCallback: jest.fn(),
      setIsParsingDataCallback: jest.fn(),
    };

    toastMockery.error = jest.fn();
  });

  test("Renders the input element", () => {
    const fileSelector = mount(<FileSelector {...defaultProps} />);
    expect(fileSelector.find("input[type='file']").exists()).toBe(true);
  });
});
