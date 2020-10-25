import { Script } from "./Types";
import ResistanceBounce from "./scripts/ResistanceBounce";
import ResistanceBreakoutAnticipation from "./scripts/ResistanceBreakoutAnticipation";
import SupportBounce from "./scripts/SupportBounce";
import SupportBreakoutAnticipation from "./scripts/SupportBreakoutAnticipation";

const SCRIPTS: Script[] = [
  {
    name: "Resistance Bounce",
    isActive: true,
    contents: ResistanceBounce,
  },
  {
    name: "Resistance Breakout Anticipation",
    isActive: true,
    contents: ResistanceBreakoutAnticipation,
  },
  {
    name: "Support Bounce",
    isActive: true,
    contents: SupportBounce,
  },
  {
    name: "Support Breakout Anticipation",
    isActive: true,
    contents: SupportBreakoutAnticipation,
  },
];

export default SCRIPTS;
