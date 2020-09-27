import { parse, getDateObject } from "./Parser";

describe("Parser service", () => {
  test("parse throws an error if the contents are empty", () => {
    try {
      parse("");
      expect(false).toBe(true);
    } catch (err: unknown) {
      expect((err as Error).message).toBe("Empty contents");
    }
  });

  test("getDateObject returns the Date object with valid data", () => {
    const dateString: string = "14.09.2020 07:01:02";
    const dateObject = getDateObject(dateString);

    expect(dateObject.getFullYear()).toBe(2020);
    expect(dateObject.getMonth()).toBe(8);
    expect(dateObject.getDate()).toBe(14);
    expect(dateObject.getHours()).toBe(7);
    expect(dateObject.getMinutes()).toBe(1);
    expect(dateObject.getSeconds()).toBe(2);
  });

  test("parse returns the array with the parsed csv rows", () => {
    const csvContents: string = `
      ignored row
      14.09.2020 07:01:02 GMT+0200,1,2,3,4,5
      15.10.2021 08:35:11 GMT+0200,11,22,33,44,55
      15.10.2021 08:35:11 GMT+0200
    `;
    const data = parse(csvContents.trim());

    expect(data.length).toBe(3);

    expect(data[0].date.toUTCString()).toBe("Mon, 14 Sep 2020 05:01:02 GMT");
    expect(data[0].open).toBe(1);
    expect(data[0].high).toBe(2);
    expect(data[0].low).toBe(3);
    expect(data[0].close).toBe(4);
    expect(data[0].volume).toBe(5);

    expect(data[1].date.toUTCString()).toBe("Fri, 15 Oct 2021 06:35:11 GMT");
    expect(data[1].open).toBe(11);
    expect(data[1].high).toBe(22);
    expect(data[1].low).toBe(33);
    expect(data[1].close).toBe(44);
    expect(data[1].volume).toBe(55);

    expect(data[2].date.toUTCString()).toBe("Fri, 15 Oct 2021 06:35:11 GMT");
    expect(data[2].open).toBe(0);
    expect(data[2].high).toBe(0);
    expect(data[2].low).toBe(0);
    expect(data[2].close).toBe(0);
    expect(data[2].volume).toBe(0);
  });

  test("parse throws an error if the date is invalid", () => {
    const csvContents: string = `
      ignored row
      14.66.2020 07:01:02 GMT+0200,1,2,3,4,5
    `;
    try {
      parse(csvContents.trim());
      expect(true).toBe(false);
    } catch (err: unknown) {
      expect((err as Error).message).toBe("Invalid date: 14.66.2020 07:01:02 GMT+0200");
    }
  });
});
