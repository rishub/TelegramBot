import React, { useState } from 'react';
import _ from 'lodash';

const SelectChats = ({
  chats,
  setChats,
  updateChats,
  selectedChats,
  loadingChats,
}) => {
  const [filter, setFilter] = useState('');

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

  return (
    <>
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
        <button onClick={updateChats}>Update list</button>
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
    </>
  );
};

export default SelectChats;
