import React from 'react';

import styles from './confirmationModal.module.css';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
  <div className={styles.confirmation}>
    {message}
    <div className={styles.buttonsContainer}>
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
