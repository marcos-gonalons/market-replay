import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ParserWorker, ParserWorkerMessageOut } from "../../services/csvParser/Parser.worker";
import { ChartData } from "../../types/ChartData";

// import styles from "./FileSelector.module.css";

interface Props {
  readonly setDataCallback: (data: ChartData[]) => void;
  readonly setIsParsingDataCallback: (v: boolean) => void;
}

function FileSelector({ setDataCallback, setIsParsingDataCallback }: Props): JSX.Element {
  const [parserWorker, setParserWorker] = useState<ParserWorker | null>(null);

  useEffect(() => {
    // eslint-disable-next-line
    setParserWorker(new (require("worker-loader!../../services/csvParser/Parser.worker").default)() as ParserWorker);
  }, []);

  useEffect(() => {
    if (!parserWorker) return;

    parserWorker.onmessage = ({ data }: MessageEvent) => {
      setIsParsingDataCallback(false);
      onReceiveParserResult(data as ParserWorkerMessageOut, setDataCallback);
    };

    return () => {
      if (!parserWorker) return;
      parserWorker.onmessage = null;
      parserWorker.terminate();
    };
  }, [parserWorker, setDataCallback, setIsParsingDataCallback]);

  return (
    <div>
      <input
        type="file"
        onChange={({ target: { files } }: React.ChangeEvent<HTMLInputElement>) => {
          onChangeFile(files![0], parserWorker, setIsParsingDataCallback);
        }}
      />
    </div>
  );
}

function onChangeFile(
  file: File,
  worker: ParserWorker | null,
  setIsParsingDataCallback: Props["setIsParsingDataCallback"]
): FileReader | null {
  if (!file || !worker) return null;

  const reader = new FileReader();
  reader.readAsText(file);

  reader.onload = (event: ProgressEvent<FileReader>) => {
    if (!event.target || !event.target.result) {
      toast.error("An error occurred while reading the file contents");
      return;
    }

    try {
      setIsParsingDataCallback(true);
      worker.postMessage((event.target.result as string).trim());
    } catch (err: unknown) {
      setIsParsingDataCallback(false);
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
export type { Props };
