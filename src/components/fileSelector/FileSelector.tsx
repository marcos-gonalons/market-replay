import React, { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import { DataContext } from "../../context/dataContext/DataContext";
import { ActionTypes, ChartData } from "../../context/dataContext/Types";
import { ParserWorker, ParserWorkerMessageOut } from "../../services/csvParser/Parser.worker";

// import styles from "./FileSelector.module.css";

function FileSelector(): JSX.Element {
  const { dispatch } = useContext(DataContext);
  const [parserWorker, setParserWorker] = useState<ParserWorker | null>(null);

  useEffect(() => {
    // eslint-disable-next-line
    setParserWorker(new (require("worker-loader!../../services/csvParser/Parser.worker").default)() as ParserWorker);
  }, []);

  useEffect(() => {
    if (!parserWorker) return;

    parserWorker.onmessage = ({ data }: MessageEvent) => {
      onReceiveParserResult(data as ParserWorkerMessageOut, (d: ChartData[]) => {
        dispatch({ type: ActionTypes.SET_DATA, payload: d });
      });
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
          onChangeFile(files![0], parserWorker);
        }}
      />
    </div>
  );
}

function onChangeFile(file: File, worker: ParserWorker | null): FileReader | null {
  if (!file || !worker) return null;

  const reader = new FileReader();
  reader.readAsText(file);

  reader.onload = (event: ProgressEvent<FileReader>) => {
    if (!event.target || !event.target.result) {
      toast.error("An error occurred while reading the file contents");
      return;
    }

    try {
      worker.postMessage((event.target.result as string).trim());
    } catch (err: unknown) {
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

function onReceiveParserResult(result: ParserWorkerMessageOut, setDataCallback: (d: ChartData[]) => void): void {
  if (Array.isArray(result)) {
    setDataCallback(result);
  } else {
    toast.error(result.message);
  }
}

export default FileSelector;
export { onChangeFile };
