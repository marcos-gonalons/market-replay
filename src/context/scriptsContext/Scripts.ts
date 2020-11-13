import Combo from "./scripts/Combo";
import ResistanceBreakoutAnticipation from "./scripts/ResistanceBreakoutAnticipation";
import SupportBreakoutAnticipation from "./scripts/SupportBreakoutAnticipation";
import SupportBreakoutPullback from "./scripts/SupportBreakoutPullback";
import { Script } from "./Types";

const SCRIPTS: Script[] = [
  {
    name: "Combo",
    isActive: true,
    contents: Combo,
  },
  {
    name: "Resistance Breakout Anticipation",
    isActive: true,
    contents: ResistanceBreakoutAnticipation,
  },
  {
    name: "Support Breakout Anticipation",
    isActive: true,
    contents: SupportBreakoutAnticipation,
  },
  {
    name: "Support Breakout Pullback",
    isActive: true,
    contents: SupportBreakoutPullback,
  },
];

export default SCRIPTS;
