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
import NumChats from './components/NumChats/numChats';

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

    fetchGroups();
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

  const groupsProps = {
    phoneNumber,
    selectChatsProps,
    groups,
    setGroups,
    selectedGroup,
    setSelectedGroup,
  };

  const numChatsProps = {
    phoneNumber,
  };

  if (page === PAGES.SENDING) {
    return <Sending {...sendingProps} />;
  }

  if (page === PAGES.HOME) {
    return (
      <>
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
              <button onClick={() => setManualOrGroup('manual')}>
                Manually select chats
              </button>
              OR
              <button onClick={() => setManualOrGroup('group')}>
                Select a group
              </button>
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

  if (page === PAGES.NUM_CHATS) {
    return (
      <div className="container">
        <NumChats {...numChatsProps} />
      </div>
    );
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
        <button onClick={() => setPage(PAGES.NUM_CHATS)}># of Chats</button>
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
