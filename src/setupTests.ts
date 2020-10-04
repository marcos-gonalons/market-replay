import Enzyme from "enzyme";
import ReactSixteenAdapter from "enzyme-adapter-react-16";
import "jest-canvas-mock";
Enzyme.configure({ adapter: new ReactSixteenAdapter() });
