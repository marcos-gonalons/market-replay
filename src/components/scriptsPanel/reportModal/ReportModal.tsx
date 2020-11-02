import Modal from "react-modal";
import React from "react";
import { Report } from "../../../services/reporter/Types";

export interface Props {
  readonly isVisible: boolean;
  readonly reports: Report[];
  readonly onClose: () => void;
}

export default function ReportModal({ isVisible, onClose }: Props): JSX.Element {
  return (
    <Modal
      ariaHideApp={false}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
      isOpen={isVisible}
      onRequestClose={onClose}
      style={{
        content: {},
      }}
    >
      Reports
    </Modal>
  );
}
