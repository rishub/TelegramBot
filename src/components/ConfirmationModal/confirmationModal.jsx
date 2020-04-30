import React from 'react';

import './confirmationModal.css';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
  <div className="confirmation">
    {message}
    <div className="buttonsContainer">
      <button style={{ background: 'red' }} onClick={onCancel}>
        No
      </button>
      <button style={{ background: 'green' }} onClick={onConfirm}>
        Yes
      </button>
    </div>
  </div>
);

export default ConfirmationModal;
