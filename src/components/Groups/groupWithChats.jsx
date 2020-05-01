import _ from 'lodash';
import React, { useState } from 'react';

const groupWithChats = ({
  groups,
  selectedGroup,
  setSelectedGroup,
  removeChatFromGroup,
  addSelectedChats,
  isEditable,
}) => {
  return (
    <>
      <div className="chats">
        <h2>Select group</h2>
        <div className="chatsList">
          {groups.map(group => {
            const { name, id } = group;
            const highlightStyle =
              group === selectedGroup ? { background: 'yellow ' } : [];
            return (
              <div
                key={id}
                className="chatRow"
                style={highlightStyle}
                onClick={() => setSelectedGroup(group)}
              >
                {name}
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
                    <span className="x" onClick={() => removeChatFromGroup(id)}>
                      &#10005;
                    </span>
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
export default groupWithChats;
