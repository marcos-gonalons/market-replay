import React, { useEffect, useContext, useState } from "react";
import { toast } from "react-toastify";
import { setDataAction, setIsParsingDataAction } from "../../../context/globalContext/Actions";
import { GlobalContext } from "../../../context/globalContext/GlobalContext";
import { ReducerAction } from "../../../context/Types";
import { AppWorker, MessageOut, ParserWorkerMessageOut } from "../../../worker/Types";

// import styles from "./FileSelector.module.css";

function FileSelector(): JSX.Element {
  const {
    dispatch,
    state: { worker },
  } = useContext(GlobalContext);

  const [isListenerSetted, setIsListenerSetted] = useState<boolean>(false);

  useEffect(() => {
    if (isListenerSetted) return;

    setIsListenerSetted(true);
    worker.addEventListener("message", ({ data }: MessageEvent) => {
      const { error, type, payload } = data as MessageOut & { error: Error };

      if (error) {
        toast.error(error.message);
        return;
      }

      if (type !== "parser") return;

      dispatch(setIsParsingDataAction(false));
      dispatch(setDataAction(payload as ParserWorkerMessageOut));
    });
  }, [worker, dispatch, isListenerSetted]);

  return (
    <div>
      <input
        type="file"
        onChange={({ target: { files } }: React.ChangeEvent<HTMLInputElement>) => {
          onChangeFile(files![0], worker as AppWorker, dispatch);
        }}
      />
    </div>
  );
}

function onChangeFile(file: File, parserWorker: AppWorker, dispatch: React.Dispatch<ReducerAction>): FileReader | null {
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
      parserWorker.postMessage({
        type: "parser",
        payload: (event.target.result as string).trim(),
      });
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

export default FileSelector;
export { onChangeFile };
