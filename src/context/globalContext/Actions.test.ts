import { ReducerAction } from "../Types";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionTypes } from "./Types";
import { setDataAction, setIsParsingDataAction } from "./Actions";

describe("GlobalContext Actions", () => {
  test("Returns the setDataAction object correctly", () => {
    const data = [1, 2, 3] as any;
    const expectedAction: ReducerAction = {
      type: ActionTypes.SET_DATA,
      payload: data,
    };

    expect(expectedAction).toEqual(setDataAction(data));
  });

  test("Returns the setIsParsingDataAction object correctly", () => {
    const v = false;
    const expectedAction: ReducerAction = {
      type: ActionTypes.SET_IS_PARSING_DATA,
      payload: v,
    };

    expect(expectedAction).toEqual(setIsParsingDataAction(v));
  });
});
