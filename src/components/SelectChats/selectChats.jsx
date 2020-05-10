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
  const filteredChats = _.filter(chats, c =>
    c.name.toLowerCase().includes(filter)
  );

  const onFilterChange = e => {
    const filter = e.target.value.toLowerCase();
    setFilter(filter);
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
        isChecked: filteredChats.some(
          chat => JSON.stringify(chat) === JSON.stringify(c)
        )
          ? !deselect
          : c.isChecked,
      }))
    );
  };

  const handleSelectAll = e => {
    const val = e.target.checked;

    if (val) {
      updateAllFiltered();
    } else {
      updateAllFiltered(true);
    }
  };

  return (
    <>
      <div className="chats">
        <h2>Available Chats</h2>
        <div className="chatsList">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" onChange={handleSelectAll} />
              <span style={{ marginLeft: '10px' }}>Select all</span>
            </div>
            <span
              style={{ color: 'blue', cursor: 'pointer' }}
              onClick={updateChats}
            >
              Refresh list
            </span>
          </div>
          <input
            placeholder="Filter..."
            value={filter}
            onChange={onFilterChange}
          />
          {loadingChats && <div className="loader" />}
          {!loadingChats &&
            _.map(filteredChats, chat => {
              const { id, name, isChecked } = chat;

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
        {/*<div className="selectAllButtons">*/}
        {/*  <button onClick={() => updateAllFiltered()}>Select all</button>*/}
        {/*  <button onClick={() => updateAllFiltered(true)}>Deselect all</button>*/}
        {/*</div>*/}
        {/*<button onClick={updateChats}>Refresh list</button>*/}
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
