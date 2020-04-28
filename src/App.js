import React, { useEffect, useState } from 'react';
import axios from 'axios';
import _ from 'lodash';

import Login from './components/Login/login';

import './App.css';

const Main = ({ phoneNumber }) => {
  const [chats, setChats] = useState({});
  const [selectedChats, setSelectedChats] = useState([]);
  const [filter, setFilter] = useState('');
  const [message, setMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const preloadChats = async () => {
    setLoadingChats(true);
    const { data } = await axios.get('/chatData', { params: { phoneNumber } });
    const chatData = data.chatData;
    setChats(chatData);
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
  };

  const filteredChats = _.keys(
    _.pickBy(chats, v => v.toLowerCase().includes(filter))
  );

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
            _.map(chats, (chatName, chatId) => {
              const isChecked = selectedChats.includes(chatId);

              if (!filteredChats.includes(chatId)) {
                return;
              }

              return (
                <div
                  className="chatRow"
                  key={chatId}
                  onClick={() =>
                    setSelectedChats(_.xor(selectedChats, [chatId]))
                  }
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                  />
                  {chatName}
                </div>
              );
            })}
        </div>
        <div className="selectAllButtons">
          <button
            onClick={() =>
              setSelectedChats([...selectedChats, ...filteredChats])
            }
          >
            Select all
          </button>
          <button onClick={() => setSelectedChats([])}>Deselect all</button>
        </div>
        <button onClick={preloadChats}>Update list</button>
      </div>
      <div className="message">
        <h2>Message Body</h2>
        <textarea value={message} onChange={e => setMessage(e.target.value)} />
        <button onClick={sendMessage}>
          {sendingMessage ? <div className="loader" /> : 'Send'}
        </button>
      </div>
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
