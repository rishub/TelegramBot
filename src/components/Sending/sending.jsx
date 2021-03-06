import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import _ from 'lodash';

import './sending.css';

const Sending = ({ selectedChats, setPage, message, phoneNumber }) => {
  const [successes, setSuccesses] = useState([]);
  const [failures, setFailures] = useState([]);
  const [errorMessages, setErrorMessages] = useState({});
  const [loading, setLoading] = useState(false);

  const sendMessageToChats = useCallback(
    async chats => {
      const { data } = await axios.post('/api/sendMessage', {
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
    let allErrorMessages = {};
    for (const chats of chatChunks) {
      try {
        const data = await sendMessageToChats(chats);
        allSuccesses = [...allSuccesses, ...data.success_ids];
        allFailures = [...allFailures, ...data.failure_ids];
        allErrorMessages = { ...allErrorMessages, ...data.error_messages };
        setSuccesses(allSuccesses);
        setFailures(allFailures);
        setErrorMessages(allErrorMessages);
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
    const currentErrorMessages = _.cloneDeep(errorMessages);
    setErrorMessages({ ...currentErrorMessages, ...data.error_messages });
    setLoading(false);
  };

  return (
    <Fragment>
      {!loading && (
        <Link className="backArrow" to="/">
          Back to all chats
        </Link>
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
                    <div className="errorMessage">
                      Error Message: {errorMessages[id]}
                    </div>
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
