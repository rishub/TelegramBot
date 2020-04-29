import React, { useEffect, useState } from 'react';
import axios from 'axios';
import _ from 'lodash';

import Login from './components/Login/login';

import './App.css';

const Main = ({ phoneNumber }) => {
  const [chats, setChats] = useState([]);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const selectedChats = _.map(
    _.filter(chats, c => c.isChecked),
    'id'
  );

  const preloadChats = async () => {
    setLoadingChats(true);
    const { data } = await axios.get('/chatData', { params: { phoneNumber } });
    const chatData = data.chatData;
    setChats(_.map(chatData, o => ({ ...o, isChecked: false, show: true })));
    setLoadingChats(false);
  };

  useEffect(() => {
    preloadChats();
  }, []);

  const sendMessage = async () => {
    setSendingMessage(true);
    try {
      const { data } = await axios.post('/sendMessage', {
        chatIds: selectedChats,
        message,
        phoneNumber,
      });
      // TODO: toastr success message
      setSendingMessage(false);
    } catch {
      // TODO: handle error
      setSendingMessage(false);
    }
  };

  const onFilterChange = e => {
    const filter = e.target.value.toLowerCase();
    setFilter(filter);
    const newChats = _.cloneDeep(chats);
    setChats(
      _.map(newChats, c => ({
        ...c,
        show: c.name.toLowerCase().includes(filter),
      }))
    );
  };

  const onChatRowClick = index => {
    const newChats = _.cloneDeep(chats);
    newChats[index].isChecked = !newChats[index].isChecked;
    setChats(newChats);
  };

  const updateAllFiltered = (deselect = false) => {
    const newChats = _.cloneDeep(chats);
    setChats(
      _.map(newChats, c => ({
        ...c,
        isChecked: deselect ? !c.show : c.show,
      }))
    );
  };

  return (
    <div className="container">
      <div className="chats">
        <h2>Available Chats</h2>
        <div className="chatsList">
          <input
            placeholder="Filter..."
            value={filter}
            onChange={onFilterChange}
          />
          {loadingChats && <div className="loader" />}
          {!loadingChats &&
            _.map(chats, (chat, index) => {
              const { id, name, isChecked, show } = chat;
              if (!show) {
                return;
              }

              return (
                <div
                  className="chatRow"
                  key={id}
                  onClick={() => onChatRowClick(index)}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                  />
                  {name}
                </div>
              );
            })}
        </div>
        <div className="selectAllButtons">
          <button onClick={() => updateAllFiltered()}>Select all</button>
          <button onClick={() => updateAllFiltered(true)}>Deselect all</button>
        </div>
        <button onClick={preloadChats}>Update list</button>
      </div>
      <div className="message">
        <h2>Message Body</h2>
        <textarea value={message} onChange={e => setMessage(e.target.value)} />
        <button onClick={() => setShowConfirmation(true)}>
          {sendingMessage ? <div className="loader" /> : 'Send'}
        </button>
      </div>
      {showConfirmation && (
        <div className="confirmation">
          Are you sure you want to send "{message}" this message to{' '}
          {selectedChats.length} chat(s)?
          <div style={{ display: 'flex' }}>
            <button onClick={() => setShowConfirmation(false)}>No</button>
            <button
              onClick={() => {
                sendMessage();
                setShowConfirmation(false);
              }}
            >
              Yes
            </button>
          </div>
        </div>
      )}
    </div>
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
