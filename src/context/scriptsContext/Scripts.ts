import Combo from "./scripts/Combo";
import EURUSD_1h from "./scripts/EURUSD-1h";
import GER30_1m from "./scripts/GER30-1m";
import ResistanceBounce from "./scripts/ResistanceBounce";
import ResistanceBreakoutAnticipation from "./scripts/ResistanceBreakoutAnticipation";
import SupportBounce from "./scripts/SupportBounce";
import SupportBreakoutAnticipation from "./scripts/SupportBreakoutAnticipation";
import { Script } from "./Types";

const SCRIPTS: Script[] = [
  {
    name: "GER30 1M",
    isActive: true,
    contents: GER30_1m,
  },
  {
    name: "EURUSD 1H",
    isActive: true,
    contents: EURUSD_1h,
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
  {
    name: "Support Bounce",
    isActive: true,
    contents: SupportBounce,
  },
];

export default SCRIPTS;
