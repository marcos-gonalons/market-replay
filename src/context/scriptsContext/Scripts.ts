import AUDUSD_1h from "./scripts/AUDUSD-1h";
import Combo from "./scripts/Combo";
import EURUSD_1h from "./scripts/EURUSD-1h";
import GBPUSD_1h from "./scripts/GBPUSD-1h";
import GER30_1m from "./scripts/GER30-1m";
import NZDUSD_1h from "./scripts/NZDUSD-1h";
import ResistanceBounce from "./scripts/ResistanceBounce";
import ResistanceBreakoutAnticipation from "./scripts/ResistanceBreakoutAnticipation";
import SupportBounce from "./scripts/SupportBounce";
import SupportBreakoutAnticipation from "./scripts/SupportBreakoutAnticipation";
import USDCAD_1h from "./scripts/USDCAD-1h";
import USDCHF_1h from "./scripts/USDCHF-1h";
import USDJPY_1h from "./scripts/USDJPY-1h";
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
    name: "GBPUSD 1H",
    isActive: true,
    contents: GBPUSD_1h,
  },
  {
    name: "USDCAD 1H",
    isActive: true,
    contents: USDCAD_1h,
  },
  {
    name: "USDJPY 1H",
    isActive: true,
    contents: USDJPY_1h,
  },
  {
    name: "USDCHF 1H",
    isActive: true,
    contents: USDCHF_1h,
  },
  {
    name: "NZDUSD 1H",
    isActive: true,
    contents: NZDUSD_1h,
  },
  {
    name: "AUDUSD 1H",
    isActive: true,
    contents: AUDUSD_1h,
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
