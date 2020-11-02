import React from "react";
import { Modal } from "semantic-ui-react";

export interface Props {
  readonly isVisible: boolean;
  readonly onClose: () => void;
}

export default function HelpModal({ isVisible, onClose }: Props): JSX.Element {
  return (
    <Modal centered={false} open={isVisible} onClose={onClose}>
      <Modal.Content>Help</Modal.Content>
    </Modal>
  );
}
