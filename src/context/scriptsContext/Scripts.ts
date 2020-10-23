import { Script } from "./Types";
import ResistanceBounce from "./scripts/ResistanceBounce";
import ResistanceBreakoutAnticipation from "./scripts/ResistanceBreakoutAnticipation";

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
];

export default SCRIPTS;
