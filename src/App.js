import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import _ from 'lodash';

import Login from './components/Login/login';
import SelectChats from './components/SelectChats/selectChats';
import MessageBody from './components/MessageBody/messageBody';
import ConfirmationModal from './components/ConfirmationModal/confirmationModal';
import Sending from './components/Sending/sending';
import Team from './components/Team/team';
import Groups from './components/Groups/groups';
import CreateChannel from './components/CreateChannel/createChannel';

import { PAGES } from './constants';

import './App.css';

const Main = ({ phoneNumber, page, setPage }) => {
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [manualOrGroup, setManualOrGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  let selectedChats = _.filter(chats, c => c.isChecked);
  if (manualOrGroup === 'group' && selectedGroup) {
    selectedChats = selectedGroup.chats;
  }

  const updateChats = useCallback(async () => {
    setLoadingChats(true);
    const { data } = await axios.get('/chatData', { params: { phoneNumber } });
    const chatData = data.chatData;
    setChats(_.map(chatData, o => ({ ...o, isChecked: false, show: true })));
    setLoadingChats(false);
  }, [phoneNumber]);

  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await axios.get('/groups', { params: { phoneNumber } });
      setGroups(data.groups || []);
    };

    if (phoneNumber === '') {
      return;
    }

    fetchGroups();
    updateChats();
  }, [updateChats, phoneNumber]);

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

  const groupsProps = {
    phoneNumber,
    selectChatsProps,
    groups,
    setGroups,
    selectedGroup,
    setSelectedGroup,
  };

  const createChannelProps = {
    phoneNumber,
  };

  if (page === PAGES.SENDING) {
    return <Sending {...sendingProps} />;
  }

  if (page === PAGES.HOME) {
    const ButtonManual = () => (
      <button onClick={() => setManualOrGroup('manual')}>
        Select chats manually
      </button>
    );
    const ButtonGroup = () => (
      <button onClick={() => setManualOrGroup('group')}>Select a group</button>
    );
    return (
      <>
        {manualOrGroup && (
          <div style={{ width: '200px' }}>
            {manualOrGroup === 'manual' ? <ButtonGroup /> : <ButtonManual />}
          </div>
        )}
        <div
          className={`container ${showConfirmation ? 'blur' : ''}`}
          style={{ justifyContent: 'space-between' }}
        >
          {manualOrGroup ? (
            <>
              {manualOrGroup === 'manual' ? (
                <SelectChats {...selectChatsProps} />
              ) : (
                <Groups {...groupsProps} isEditable={false} />
              )}
            </>
          ) : (
            <div className="manualOrGroup">
              <ButtonManual />
              OR
              <ButtonGroup />
            </div>
          )}
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
    return (
      <div className="container">
        <Groups {...groupsProps} />
      </div>
    );
  }

  if (page === PAGES.CREATE_CHANNEL) {
    return (
      <div className="container">
        <CreateChannel {...createChannelProps} />
      </div>
    );
  }
};

const App = () => {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [page, setPage] = useState(PAGES.HOME);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem('auth');
      try {
        const { data } = await axios.get('/checkAuth', {
          params: { auth },
        });
        if (data.loggedIn) {
          setPhoneNumber(data.phoneNumber);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const auth = localStorage.getItem('auth');
    if (!_.isNil(auth) && auth !== '') {
      setAuthenticated(true);
    }
    checkAuth();
  }, []);

  const logOut = () => {
    setAuthenticated(false);
    setPhoneNumber('');
    localStorage.setItem('auth', '');
  };

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
        <div className="navLinks">
          <img
            className="telegramIcon"
            src="https://www.shareicon.net/data/128x128/2016/11/03/849462_messenger_512x512.png"
            alt="Telegram automation"
          />
          <span
            className={`navLink ${[page === PAGES.HOME ? 'active' : '']}`}
            onClick={() => setPage(PAGES.HOME)}
          >
            Home
          </span>
          <span
            className={`navLink ${[page === PAGES.TEAM ? 'active' : '']}`}
            onClick={() => setPage(PAGES.TEAM)}
          >
            Manage team
          </span>
          <span
            className={`navLink ${[page === PAGES.GROUPS ? 'active' : '']}`}
            onClick={() => setPage(PAGES.GROUPS)}
          >
            Manage groups
          </span>
          <span
            className={`navLink ${[
              page === PAGES.CREATE_CHANNEL ? 'active' : '',
            ]}`}
            onClick={() => setPage(PAGES.CREATE_CHANNEL)}
          >
            Create a channel
          </span>
        </div>
        <div>
          {'(' +
            phoneNumber.slice(0, 3) +
            ') ' +
            phoneNumber.slice(3, 6) +
            '-' +
            phoneNumber.slice(6, 10)}
          <span className="navLink" style={{ color: 'blue' }} onClick={logOut}>
            Log out
          </span>
        </div>
      </div>
      <div className="main">
        <Main {...mainProps} />
      </div>
    </>
  );
};

export default App;
