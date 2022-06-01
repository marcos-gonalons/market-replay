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
import EUROSTOXX50_5m from "./scripts/EUROSTOXX50-5m";
import { Script } from "./Types";

const SCRIPTS: Script[] = [
  {
    name: "GER30 1M",
    isActive: false,
    contents: GER30_1m,
  },
  {
    name: "EUROSTOXX50 5M",
    isActive: false,
    contents: EUROSTOXX50_5m,
  },
  {
    name: "EURUSD 1H",
    isActive: false,
    contents: EURUSD_1h,
  },
  {
    name: "GBPUSD 1H",
    isActive: false,
    contents: GBPUSD_1h,
  },
  {
    name: "USDCAD 1H",
    isActive: false,
    contents: USDCAD_1h,
  },
  {
    name: "USDJPY 1H",
    isActive: false,
    contents: USDJPY_1h,
  },
  {
    name: "USDCHF 1H",
    isActive: false,
    contents: USDCHF_1h,
  },
  {
    name: "NZDUSD 1H",
    isActive: false,
    contents: NZDUSD_1h,
  },
  {
    name: "AUDUSD 1H",
    isActive: false,
    contents: AUDUSD_1h,
  },
  {
    name: "Combo",
    isActive: false,
    contents: Combo,
  },
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
];

export default SCRIPTS;
