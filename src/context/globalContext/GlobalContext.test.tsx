import { reducer, initialState } from "./GlobalContext";
import { ActionTypes } from "./Types";

describe("GlobalContext Reducer", () => {
  test("SET_DATA action sets the data property of the state", () => {
    const payload = [1, 2, 3];
    const action = { type: ActionTypes.SET_DATA, payload };
    const newState = reducer(initialState, action);

    expect(newState.data).toEqual(payload);
  });

  test("SET_IS_PARSING_DATA action sets the isParsingData property of the state", () => {
    const payload = true;
    const action = { type: ActionTypes.SET_IS_PARSING_DATA, payload };
    const newState = reducer(initialState, action);

    expect(newState.isParsingData).toEqual(payload);
  });
});
