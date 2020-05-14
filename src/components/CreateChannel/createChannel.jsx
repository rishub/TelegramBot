import React, { useState } from 'react';
import axios from 'axios';

const CreateChannel = ({ phoneNumber }) => {
  const [channelName, setChannelName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const createChannel = async () => {
    setLoading(true);
    setSubmitted(true);
    const { data } = await axios.post('/api/createChannel', {
      channelName,
      phoneNumber,
    });
    setLoading(false);
  };

  const onAddTeam = async () => {
    setAdding(true);
    const { data } = await axios.post('/api/addMembersToChannel', {
      channelName,
      phoneNumber,
    });
    setAdding(false);
    setAdded(true);
  };

  const onBack = async () => {
    setSubmitted(false);
    setAdded(false);
    setChannelName('');
  };

  return (
    <div>
      {!submitted && (
        <>
          <h2>Create a channel</h2>
          <input
            placeholder="Channel name"
            value={channelName}
            onChange={e => setChannelName(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter') createChannel();
            }}
          />
          <button onClick={createChannel}>Create</button>
        </>
      )}
      {submitted && !adding && !added && (
        <>
          {loading && <h3>Creating channel: {channelName}...</h3>}
          {!loading && (
            <>
              <h3>Successfully created {channelName}!</h3>
              <button onClick={onAddTeam}>
                Add all Alchemy team members to channel
              </button>
              <button onClick={onBack}>Create another channel</button>
            </>
          )}
        </>
      )}
      {submitted && (adding || added) && (
        <>
          {adding && <h3>Adding Alchemy team members to {channelName}...</h3>}
          {!adding && added && (
            <>
              <h3>Successfully added team members to {channelName}!</h3>
              <button onClick={onBack}>Create another channel</button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CreateChannel;
