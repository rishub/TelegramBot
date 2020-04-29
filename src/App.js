import React, { useEffect, useState } from 'react';
import axios from 'axios';
import _ from 'lodash';

import Login from './components/Login/login';
import Sending from './components/Sending/sending';

import './App.css';

const Main = ({ phoneNumber }) => {
  const [chats, setChats] = useState([]);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const selectedChats = _.filter(chats, c => c.isChecked);

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

  const onChatRowClick = id => {
    const newChats = _.cloneDeep(chats);
    const chat = _.find(newChats, c => c.id === id);
    chat.isChecked = !chat.isChecked;
    setChats(newChats);
  };

  const updateAllFiltered = (deselect = false) => {
    const newChats = _.cloneDeep(chats);

    setChats(
      _.map(newChats, c => ({
        ...c,
        isChecked: c.show ? !deselect : c.isChecked,
      }))
    );
  };

  if (sendingMessage) {
    const sendingProps = {
      selectedChats,
      setSendingMessage,
      message,
      phoneNumber,
    };

    return <Sending {...sendingProps} />;
  }

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
            _.map(chats, chat => {
              const { id, name, isChecked, show } = chat;
              if (!show) {
                return;
              }

              return (
                <div
                  className="chatRow"
                  key={id}
                  onClick={() => onChatRowClick(id)}
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
      <div className="chats">
        <h2>Selected Chats</h2>
        <div className="chatsList">
          <p style={{ margin: 0 }}>{selectedChats.length} items selected</p>
          {_.map(selectedChats, chat => {
            const { id, name } = chat;

            return (
              <div className="chatRow staticRow" key={id}>
                {name}
                <span className="x" onClick={() => onChatRowClick(id)}>
                  &#10005;
                </span>
              </div>
            );
          })}
        </div>
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
          Are you sure you want to send
          <br /> "{message}" <br />
          to {selectedChats.length} chat(s)?
          <div style={{ display: 'flex' }}>
            <button
              style={{ background: 'red' }}
              onClick={() => setShowConfirmation(false)}
            >
              No
            </button>
            <button
              style={{ background: 'green' }}
              onClick={() => {
                setShowConfirmation(false);
                setSendingMessage(true);
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
