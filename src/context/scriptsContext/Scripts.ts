import { Script } from "./Types";
import ResistanceBreakoutAnticipation from "./scripts/ResistanceBreakoutAnticipation";
import SupportBreakoutAnticipation from "./scripts/SupportBreakoutAnticipation";
import SupportBreakoutPullback from "./scripts/SupportBreakoutPullback";

const SCRIPTS: Script[] = [
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
