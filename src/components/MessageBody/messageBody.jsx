import React from 'react';

const MessageBody = ({ message, setMessage, onSubmit }) => (
  <>
    <h2>Message Body</h2>
    <textarea value={message} onChange={e => setMessage(e.target.value)} />
    <button onClick={onSubmit}>Send</button>
  </>
);

export default MessageBody;
