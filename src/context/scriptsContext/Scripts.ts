import Combo from "./scripts/Combo";
import GER30 from "./scripts/GER30";
import ResistanceBreakoutAnticipation from "./scripts/ResistanceBreakoutAnticipation";
import SupportBreakoutAnticipation from "./scripts/SupportBreakoutAnticipation";
import SupportBreakoutPullback from "./scripts/SupportBreakoutPullback";
import { Script } from "./Types";

const SCRIPTS: Script[] = [
  {
    name: "GER30",
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
    name: "Support Breakout Pullback",
    isActive: true,
    contents: SupportBreakoutPullback,
  },
];

export default SCRIPTS;
