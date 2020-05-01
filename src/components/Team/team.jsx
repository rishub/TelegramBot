import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import axios from 'axios';

const Team = ({ phoneNumber }) => {
  const [username, setUsername] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState([]);

  useEffect(() => {
    const fetchCurrentMembers = async () => {
      setLoading(true);
      const { data } = await axios.get('/team');
      setTeam(data.team || []);
      setLoading(false);
    };

    fetchCurrentMembers();
  }, []);

  const addMember = async () => {
    setLoading(true);
    const { data } = await axios.post('/addMember', {
      phoneNumber,
      username,
    });

    if (data.error) {
      setIsValid(false);
    } else {
      setIsValid(true);
      setTeam(data.team);
    }
    setLoading(false);
  };

  const removeMember = async username => {
    setLoading(true);
    const { data } = await axios.post('/removeMember', {
      phoneNumber,
      username,
    });

    if (data.error) {
      return;
    }

    setTeam(data.team);
    setLoading(false);
  };

  return (
    <>
      <div className="chats" style={{ margin: '0 auto' }}>
        <h2>Current Alchemy team</h2>
        <input
          placeholder="Enter username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <button onClick={addMember}>Add to team</button>
        {!isValid && (
          <p className="legal" style={{ color: 'red' }}>
            Please enter a valid Telegram username
          </p>
        )}
        {loading && <div className="loader" />}
        {!loading && (
          <>
            {_.map(team, member => {
              const { username, firstName, lastName } = member;

              return (
                <div className="chatRow staticRow" key={username}>
                  {firstName} {lastName} ({username})
                  <span className="x" onClick={() => removeMember(username)}>
                    &#10005;
                  </span>
                </div>
              );
            })}
            <p className="legal">
              These names will be filtered out when attempting to @mention
              people in automated messages
            </p>
          </>
        )}
      </div>
    </>
  );
};

export default Team;
