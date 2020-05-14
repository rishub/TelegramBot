import React from 'react';
import _ from 'lodash';
import axios from 'axios';
import SelectChats from '../SelectChats/selectChats';
import GroupWithChats from './groupWithChats';

const Groups = ({
  phoneNumber,
  selectChatsProps,
  groups,
  setGroups,
  selectedGroup,
  setSelectedGroup,
  isEditable = true,
}) => {
  const addSelectedChats = async () => {
    const { selectedChats, chats, setChats } = selectChatsProps;

    const { data } = await axios.post('/api/addChatsToGroup', {
      phoneNumber,
      name: selectedGroup.name,
      chats: _.map(selectedChats, c => ({ id: c.id, name: c.name })),
    });

    setSelectedGroup(data.group);

    const newChats = _.cloneDeep(chats);
    setChats(
      _.map(newChats, c => ({
        ...c,
        isChecked: false,
      }))
    );
  };

  const removeChatFromGroup = async chatId => {
    const { data } = await axios.post('/api/removeChatFromGroup', {
      phoneNumber,
      name: selectedGroup.name,
      chatId,
    });

    setSelectedGroup(data.group);
  };

  const groupWithChatsProps = {
    phoneNumber,
    groups,
    setGroups,
    selectedGroup,
    setSelectedGroup,
    isEditable,
    removeChatFromGroup,
    addSelectedChats,
  };

  return (
    <>
      <GroupWithChats {...groupWithChatsProps} />
      {selectedGroup && isEditable && (
        <div
          style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
        >
          <SelectChats {...selectChatsProps} />
        </div>
      )}
    </>
  );
};

export default Groups;
