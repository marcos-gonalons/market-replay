import ResistanceBounce from "./scripts/ResistanceBounce";
import ResistanceBreakoutAnticipation from "./scripts/ResistanceBreakoutAnticipation";
import SupportBounce from "./scripts/SupportBounce";
import SupportBreakoutAnticipation from "./scripts/SupportBreakoutAnticipation";
import EMACrossover from "./scripts/EmaCrossover";
import Ranges from "./scripts/Ranges";
import Test from "./scripts/Test";
import { Script } from "./Types";

const SCRIPTS: Script[] = [
  {
    name: "Resistance Breakout Anticipation",
    isActive: false,
    contents: ResistanceBreakoutAnticipation,
  },
  {
    name: "Support Breakout Anticipation",
    isActive: false,
    contents: SupportBreakoutAnticipation,
  },
  {
    name: "Resistance Bounce",
    isActive: false,
    contents: ResistanceBounce,
  },
  {
    name: "Support Bounce",
    isActive: false,
    contents: SupportBounce,
  },
  {
    name: "EMA Crossover",
    isActive: false,
    contents: EMACrossover,
  },
  {
    name: "Ranges",
    isActive: false,
    contents: Ranges,
  },
  {
    name: "Test",
    isActive: false,
    contents: Test
  }
];

export default SCRIPTS;
