import React from "react";
import { toast } from "react-toastify";
import { parse } from "../../services/csvParser/Parser";
import { ChartData } from "../../types/ChartData";

// import styles from "./FileSelector.module.css";

interface Props {
  readonly setDataCallback: (data: ChartData[]) => void;
}

function FileSelector({ setDataCallback }: Props): JSX.Element {
  return (
    <div>
      <input
        type="file"
        onChange={({ target: { files } }: React.ChangeEvent<HTMLInputElement>) => {
          onChangeFile(files![0], setDataCallback);
        }}
      />
    </div>
  );
}

function onChangeFile(file: File, setData: (d: ChartData[]) => void): FileReader | null {
  if (!file) return null;

  const reader = new FileReader();
  reader.readAsText(file);

  reader.onload = (event: ProgressEvent<FileReader>) => {
    if (!event.target || !event.target.result) {
      toast.error("An error occurred while reading the file contents");
      return;
    }

    try {
      setData(parse((event.target.result as string).trim()));
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

export default FileSelector;
export { onChangeFile };
export type { Props };
