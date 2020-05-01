import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import _ from 'lodash';

import Login from './components/Login/login';
import SelectChats from './components/SelectChats/selectChats';
import MessageBody from './components/MessageBody/messageBody';
import ConfirmationModal from './components/ConfirmationModal/confirmationModal';
import Sending from './components/Sending/sending';
import Team from './components/Team/team';

import { PAGES } from './constants';

import './App.css';

const Main = ({ phoneNumber, page, setPage }) => {
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState('');
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
      setPage(PAGES.SENDING);
      setShowConfirmation(false);
    },
  };

  const sendingProps = {
    selectedChats,
    setPage,
    phoneNumber,
    message,
  };

  const teamProps = {
    phoneNumber,
  };

  if (page === PAGES.SENDING) {
    return <Sending {...sendingProps} />;
  }

  if (page === PAGES.HOME) {
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
  }

  if (page === PAGES.TEAM) {
    return <Team {...teamProps} />;
  }

  if (page === PAGES.GROUPS) {
    return <div />;
  }
};

const App = () => {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [page, setPage] = useState(PAGES.HOME);
  const [phoneNumber, setPhoneNumber] = useState('');

  if (!isAuthenticated) {
    const loginProps = {
      phoneNumber,
      setPhoneNumber,
      setAuthenticated,
    };
    return <Login {...loginProps} />;
  }

  const mainProps = {
    phoneNumber,
    page,
    setPage,
  };
  return (
    <>
      <div className="nav">
        <button onClick={() => setPage(PAGES.TEAM)}>Manage team</button>
        <button onClick={() => setPage(PAGES.HOME)}>Home</button>
        <button onClick={() => setPage(PAGES.GROUPS)}>Manage groups</button>
        {/* if (match) {
            return '(' + match[1] + ') ' + match[2] + '-' + match[3]
          };
        */}
      </div>
      <Main {...mainProps} />
    </>
  );
};

export default App;
