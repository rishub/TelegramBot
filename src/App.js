import React, { useEffect, useState, useCallback } from 'react';
import { Switch, Route, Link } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
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

import './App.css';

const Main = ({ phoneNumber, history }) => {
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
      history.push('/sending');
      setShowConfirmation(false);
    },
  };

  const sendingProps = {
    selectedChats,
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

  const ButtonManual = () => (
    <button onClick={() => setManualOrGroup('manual')}>
      Select chats manually
    </button>
  );
  const ButtonGroup = () => (
    <button onClick={() => setManualOrGroup('group')}>Select a group</button>
  );

  return (
    <Switch>
      <Route exact path="/">
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
          {showConfirmation && (
            <ConfirmationModal {...confirmationModalProps} />
          )}
        </>
      </Route>
      <Route path="/sending">
        <Sending {...sendingProps} />
      </Route>
      <Route path="/team">
        <Team {...teamProps} />
      </Route>
      <Route path="/groups">
        <div className="container">
          <Groups {...groupsProps} />
        </div>
      </Route>
      <Route path="/createChannel">
        <div className="container">
          <CreateChannel {...createChannelProps} />
        </div>
      </Route>
    </Switch>
  );
};

const App = () => {
  const history = useHistory();
  const [isAuthenticated, setAuthenticated] = useState(false);
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
        } else {
          setAuthenticated(false);
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
    history,
  };

  const path = _.get(history, 'location.pathname', '/');

  return (
    <>
      <div className="nav">
        <div className="navLinks">
          <img
            className="telegramIcon"
            src="https://www.shareicon.net/data/128x128/2016/11/03/849462_messenger_512x512.png"
            alt="Telegram automation"
          />
          <Link className={`navLink ${[path === '/' ? 'active' : '']}`} to="/">
            Home
          </Link>
          <Link
            className={`navLink ${[path === '/team' ? 'active' : '']}`}
            to="/team"
          >
            Manage team
          </Link>
          <Link
            className={`navLink ${[path === '/groups' ? 'active' : '']}`}
            to="/groups"
          >
            Manage groups
          </Link>
          <Link
            className={`navLink ${[path === '/createChannel' ? 'active' : '']}`}
            to="/createChannel"
          >
            Create a channel
          </Link>
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
      <Main {...mainProps} />
    </>
  );
};

export default App;
