import React, { useState } from 'react';
import _ from 'lodash';
import axios from 'axios';

const GroupWithChats = ({
  phoneNumber,
  groups,
  setGroups,
  selectedGroup,
  setSelectedGroup,
  removeChatFromGroup,
  addSelectedChats,
  isEditable,
}) => {
  const [groupName, setGroupName] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const addGroup = async () => {
    if (_.map(groups, 'name').includes(groupName)) {
      setErrorMessage('Group name already exists!');
    }
    const { data } = await axios.post('/api/addGroup', { groupName, phoneNumber });
    setGroups(data.groups);
    setErrorMessage(null);
  };

  const removeGroup = async (groupName, phoneNumber) => {
    const { data } = await axios.post('/api/removeGroup', {
      groupName,
      phoneNumber,
    });
    const newGroups = data.groups;
    setGroups(newGroups);
    setErrorMessage(null);
  };

  console.log(selectedGroup);

  return (
    <>
      <div className="chats">
        <h2>Select group</h2>
        <div className="chatsList">
          {isEditable && (
            <>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  placeholder="Group name"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') addGroup();
                  }}
                />
                <button onClick={addGroup}>Add</button>
              </div>
              <p className="legal" style={{ color: 'red' }}>
                {errorMessage}
              </p>
            </>
          )}
          {groups.map(group => {
            const { name, phone_number: phoneNumber } = group;
            const highlightStyle =
              name === _.get(selectedGroup, 'name')
                ? { background: 'yellow ' }
                : [];
            return (
              <div
                key={`${name}${phoneNumber}`}
                className="chatRow"
                style={{ ...highlightStyle, justifyContent: 'space-between' }}
                onClick={() => setSelectedGroup(group)}
              >
                {name}
                {isEditable && (
                  <span
                    className="x"
                    onClick={e => {
                      e.stopPropagation();
                      removeGroup(name, phoneNumber);
                    }}
                  >
                    &#10005;
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {selectedGroup && (
        <>
          <div className="chats">
            <h2>Group - {selectedGroup.name}</h2>
            <div className="chatsList">
              {_.get(selectedGroup, 'chats', []).map(chat => {
                const { name, id } = chat;
                return (
                  <div key={id} className="chatRow staticRow">
                    {name}
                    {isEditable && (
                      <span
                        className="x"
                        onClick={() => removeChatFromGroup(id)}
                      >
                        &#10005;
                      </span>
                    )}
                  </div>
                );
              })}
              {_.isEmpty(selectedGroup.chats) && 'Group is currently empty'}
            </div>
            {isEditable && (
              <button onClick={addSelectedChats}>
                Add selected chats to group
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default GroupWithChats;
