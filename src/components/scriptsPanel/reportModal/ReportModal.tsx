import React from "react";
import { Modal } from "semantic-ui-react";
import { Report } from "../../../services/reporter/Types";

export interface Props {
  readonly isVisible: boolean;
  readonly reports: Report[];
  readonly onClose: () => void;
}

export default function ReportModal({ isVisible, onClose }: Props): JSX.Element {
  return (
    <Modal centered={false} open={isVisible} onClose={onClose}>
      <Modal.Header>Reports</Modal.Header>
      <Modal.Content>Yeah</Modal.Content>
    </Modal>
  );
}
