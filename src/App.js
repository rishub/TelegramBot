import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import _ from 'lodash';

import Login from './components/Login/login';
import SelectChats from './components/SelectChats/selectChats';
import MessageBody from './components/MessageBody/messageBody';
import ConfirmationModal from './components/ConfirmationModal/confirmationModal';
import Sending from './components/Sending/sending';

import './App.css';

const Main = ({ phoneNumber }) => {
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const selectedChats = _.filter(chats, c => c.isChecked);

  const updateChats = useCallback(async () => {
    setLoadingChats(true);
    const { data } = await axios.get('/chatData', { params: { phoneNumber } });
    const chatData = data.chatData;
    setChats(_.map(chatData, o => ({ ...o, isChecked: false, show: true })));
    setLoadingChats(false);
  }, [phoneNumber]);

  useEffect(() => {
    updateChats();
  }, [updateChats]);

  const messageBodyProps = {
    message,
    setMessage,
    onSubmit: () => setShowConfirmation(true),
  };

  const selectChatsProps = {
    chats,
    setChats,
    updateChats,
    selectedChats,
    loadingChats,
  };

  const confirmationModalProps = {
    message: `Are you sure you want to send "${message}" to ${selectedChats.length} chats?`,
    onCancel: () => setShowConfirmation(false),
    onConfirm: () => {
      setIsSending(true);
      setShowConfirmation(false);
    },
  };

  const sendingProps = {
    selectedChats,
    setIsSending,
    phoneNumber,
    message,
  };

  if (isSending) {
    return <Sending {...sendingProps} />;
  }

  return (
    <>
      <div className={`container ${showConfirmation ? 'blur' : ''}`}>
        <SelectChats {...selectChatsProps} />
        <div className="message">
          <MessageBody {...messageBodyProps} />
        </div>
      </div>
      {showConfirmation && <ConfirmationModal {...confirmationModalProps} />}
    </>
  );
};

const App = () => {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const mainProps = {
    phoneNumber,
  };
  if (isAuthenticated) {
    return <Main {...mainProps} />;
  }

  const loginProps = {
    phoneNumber,
    setPhoneNumber,
    setAuthenticated,
  };
  return <Login {...loginProps} />;
};

export default App;
