import React, { Fragment, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import _ from 'lodash';

import { PAGES } from '../../constants';

import './sending.css';

const Sending = ({ selectedChats, setPage, message, phoneNumber }) => {
  const [successes, setSuccesses] = useState([]);
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessageToChats = useCallback(
    async chats => {
      const { data } = await axios.post('/sendMessage', {
        chats,
        message,
        phoneNumber,
      });
      return data;
    },
    [message, phoneNumber]
  );

  const sendMessages = useCallback(async () => {
    setLoading(true);
    const chatChunks = _.chunk(selectedChats, 10);
    let allSuccesses = [];
    let allFailures = [];
    for (const chats of chatChunks) {
      try {
        const data = await sendMessageToChats(chats);
        allSuccesses = [...allSuccesses, ...data.success_ids];
        allFailures = [...allFailures, ...data.failure_ids];
        setSuccesses(allSuccesses);
        setFailures(allFailures);
      } catch {
        setFailures([_.map(selectedChats, 'id')]);
      }
    }
    setLoading(false);
  }, [selectedChats, sendMessageToChats]);

  useEffect(() => {
    sendMessages();
  }, [sendMessages]);

  const retry = async chat => {
    setLoading(true);

    // remove this failure for now to show loading state
    const newFailures = _.cloneDeep(failures);
    _.pull(newFailures, chat.id);
    setFailures(newFailures);

    const data = await sendMessageToChats([chat]);
    setSuccesses([...successes, ...data.success_ids]);
    setFailures([...newFailures, ...data.failure_ids]);
    setLoading(false);
  };

  return (
    <Fragment>
      {!loading && (
        <button className="backArrow" onClick={() => setPage(PAGES.HOME)}>
          Back to all chats
        </button>
      )}
      <div className="sendingList">
        <h3>Sending messages to the following chats...</h3>
        {selectedChats.map(chat => {
          const { id, name } = chat;

          let status;

          if (successes.includes(id)) {
            status = <span style={{ color: 'green' }}>&#10004;</span>;
          } else if (failures.includes(id)) {
            status = (
              <div>
                <span style={{ color: 'red' }}>&#10005;</span>
                {!loading && (
                  <span className="retry" onClick={() => retry(chat)}>
                    Retry
                  </span>
                )}
              </div>
            );
          } else {
            status = <span className="loader" style={{ marginRight: 0 }} />;
          }

          return (
            <div className="chatRow staticRow" key={id}>
              {name}
              {status}
            </div>
          );
        })}
      </div>
    </Fragment>
  );
};

export default Sending;
