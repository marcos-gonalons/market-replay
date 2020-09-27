import React from "react";
import FileSelector, { Props, onChangeFile } from "./FileSelector";
import { mount } from "enzyme";
import { toast as toastMockery } from "react-toastify";

describe("File Selector Component", () => {
  let defaultProps: Props;

  beforeEach(() => {
    defaultProps = {
      setDataCallback: jest.fn(),
    };

    toastMockery.error = jest.fn();
  });

  test("Renders the input element", () => {
    const fileSelector = mount(<FileSelector {...defaultProps} />);
    expect(fileSelector.find("input[type='file']").exists()).toBe(true);
  });

  test("onChangeFile calls the setData callback", async () => {
    const fileContents: string = `
      ignored row
      14.01.2020 07:01:02 GMT+0200,1,2,3,4,5
    `;
    const fileReader = onChangeFile(new File([fileContents], "test.csv"), defaultProps.setDataCallback) as FileReader;

    await new Promise((resolve: () => void, reject: (e: unknown) => void) => {
      fileReader.onloadend = () => {
        try {
          expect(defaultProps.setDataCallback).toHaveBeenCalledTimes(1);
          resolve();
        } catch (err: unknown) {
          reject(err);
        }
      };
    });
  });

  test("Calls toast.error when an error happens while reading the file contents", async () => {
    const fileContents: string = `
      ignored row
      14.01.2020 07:01:02 GMT+0200,1,2,3,4,5
    `;
    const fileReader = onChangeFile(new File([fileContents], "test.csv"), defaultProps.setDataCallback) as FileReader;

    await new Promise((resolve: () => void, reject: (e: unknown) => void) => {
      fileReader.onloadend = () => {
        try {
          expect(toastMockery.error).toHaveBeenCalledTimes(0);

          /* eslint-disable */
          fileReader.onerror!({} as any);

          expect(toastMockery.error).toHaveBeenCalledTimes(1);

          resolve();
        } catch (err: unknown) {
          reject(err);
        }
      };
    });
  });

  test("Calls toast.error if the file contents are not valid", async () => {
    const fileContents: string = `
      ignored row
      14.66.2020 07:01:02 GMT+0200,1,2,3,4,5
    `;
    const fileReader = onChangeFile(new File([fileContents], "test.csv"), defaultProps.setDataCallback) as FileReader;

    await new Promise((resolve: () => void, reject: (e: unknown) => void) => {
      fileReader.onloadend = () => {
        try {
          expect(toastMockery.error).toHaveBeenCalledTimes(1);
          expect(toastMockery.error).toHaveBeenCalledWith("Invalid date: 14.66.2020 07:01:02 GMT+0200");
          resolve();
        } catch (err: unknown) {
          reject(err);
        }
      };
    });
  });
});
