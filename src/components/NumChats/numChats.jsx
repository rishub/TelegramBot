import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NumChats = ({ phoneNumber }) => {
  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState([]);

  useEffect(() => {
    const getNumChats = async () => {
      setLoading(true);
      const { data } = await axios.get('/numChats', {
        params: { phoneNumber },
      });
      setChatData(data.chatData);
      setLoading(false);
    };

    getNumChats();
  }, [phoneNumber]);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2>Chat Data (last 2 months)</h2>
        {loading && <div className="loader" />}
        {chatData.map(chat => {
          const { name, numChats, id } = chat;

          return (
            <div key={id}>
              {name}, {numChats}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default NumChats;
