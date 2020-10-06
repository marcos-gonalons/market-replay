import React, { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import { setDataAction, setIsParsingDataAction } from "../../context/globalContext/Actions";
import { GlobalContext } from "../../context/globalContext/GlobalContext";
import { ChartData } from "../../context/globalContext/Types";
import { ReducerAction } from "../../context/Types";
import { ParserWorker, ParserWorkerMessageOut } from "../../services/csvParser/Parser.worker";

// import styles from "./FileSelector.module.css";

function FileSelector(): JSX.Element {
  const { dispatch } = useContext(GlobalContext);
  const [parserWorker, setParserWorker] = useState<ParserWorker | null>(null);

  useEffect(() => {
    // eslint-disable-next-line
    setParserWorker(new (require("worker-loader!../../services/csvParser/Parser.worker").default)() as ParserWorker);
  }, []);

  useEffect(() => {
    if (!parserWorker) return;

    parserWorker.onmessage = ({ data }: MessageEvent) => {
      onReceiveParserResult(data as ParserWorkerMessageOut, (d: ChartData[]) => dispatch(setDataAction(d)), dispatch);
    };

    return () => {
      if (!parserWorker) return;
      parserWorker.onmessage = null;
      parserWorker.terminate();
    };
  }, [parserWorker, dispatch]);

  return (
    <div>
      <input
        type="file"
        onChange={({ target: { files } }: React.ChangeEvent<HTMLInputElement>) => {
          onChangeFile(files![0], parserWorker, dispatch);
        }}
      />
    </div>
  );
}

function onChangeFile(
  file: File,
  parserWorker: ParserWorker | null,
  dispatch: React.Dispatch<ReducerAction>
): FileReader | null {
  if (!file || !parserWorker) return null;

  const reader = new FileReader();
  reader.readAsText(file);

  reader.onload = (event: ProgressEvent<FileReader>) => {
    if (!event.target || !event.target.result) {
      toast.error("An error occurred while reading the file contents");
      return;
    }

    try {
      dispatch(setIsParsingDataAction(true));
      parserWorker.postMessage((event.target.result as string).trim());
    } catch (err: unknown) {
      dispatch(setIsParsingDataAction(false));
      toast.error((err as Error).message);
      return;
    }
  };

  reader.onerror = () => {
    toast.error("An error occurred while reading the file contents");
    return;
  };

  return reader;
}

function onReceiveParserResult(
  result: ParserWorkerMessageOut,
  setDataCallback: (d: ChartData[]) => void,
  dispatch: React.Dispatch<ReducerAction>
): void {
  dispatch(setIsParsingDataAction(false));
  if (Array.isArray(result)) {
    setDataCallback(result);
  } else {
    toast.error(result.message);
  }
}

export default FileSelector;
export { onChangeFile };
