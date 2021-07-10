import Combo from "./scripts/Combo";
import GER30 from "./scripts/GER30-1m";
import ResistanceBounce from "./scripts/ResistanceBounce";
import ResistanceBreakoutAnticipation from "./scripts/ResistanceBreakoutAnticipation";
import SupportBreakoutAnticipation from "./scripts/SupportBreakoutAnticipation";
import { Script } from "./Types";

const SCRIPTS: Script[] = [
  {
    name: "GER30 1M",
    isActive: true,
    contents: GER30,
  },
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
    name: "Resistance Bounce",
    isActive: true,
    contents: ResistanceBounce,
  },
];

export default SCRIPTS;
