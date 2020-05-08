import React, { useState } from 'react';
import axios from 'axios';
import './login.css';

const STEP_PHONE = 'PHONE';
const STEP_2FA = '2FA';

const PhoneNumber = ({ phoneNumber, setPhoneNumber, handleSubmit }) => {
  const [valid, setValid] = useState(true);
  const [loading, setLoading] = useState(false);

  const onSubmit = () => {
    setLoading(true);
    const valid = /^\d{10}$/.test(phoneNumber);
    if (valid) {
      handleSubmit();
    } else {
      setValid(false);
    }
  };

  return (
    <div>
      <h3>Enter phone number</h3>
      <input
        className="phoneNumberInput"
        placeholder="5555555555"
        maxLength={10}
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        onKeyPress={e => {
          if (e.key === 'Enter') onSubmit();
        }}
      />
      {!valid && (
        <p className="legal" style={{ color: 'red' }}>
          Please enter a valid 10 digit US Phone Number
        </p>
      )}
      <button onClick={onSubmit}>
        {loading ? <div className="loader" /> : 'Send'}
      </button>
    </div>
  );
};

const TwoFactor = ({ code, setCode, phoneNumber, setStep, handleSubmit }) => {
  const [loading, setLoading] = useState(false);

  const onSubmit = () => {
    setLoading(true);
    handleSubmit();
  };

  return (
    <div>
      <h3>Two Factor Auth</h3>
      <p>Sent a verification code to +1{phoneNumber}</p>
      <input
        placeholder="2FA code"
        maxLength={10}
        value={code}
        onChange={e => setCode(e.target.value)}
        onKeyPress={e => {
          if (e.key === 'Enter') handleSubmit();
        }}
      />
      <button onClick={onSubmit}>
        {loading ? <div className="loader" /> : 'Send'}
      </button>
      <button onClick={() => setStep(STEP_PHONE)} className="legal buttonLink">
        Change Phone Number
      </button>
    </div>
  );
};

const LoginFlow = ({ phoneNumber, setPhoneNumber, setAuthenticated }) => {
  const [code, setCode] = useState('');
  const [phoneHash, setPhoneHash] = useState('');
  const [step, setStep] = useState(STEP_PHONE);

  const handlePhoneSubmit = async () => {
    const { data } = await axios.post('/sendCode', { phoneNumber });
    if (data.loggedIn) {
      localStorage.setItem('auth', data.auth);
      setAuthenticated(true);
    } else {
      setPhoneHash(data.hash);
      setStep(STEP_2FA);
    }
  };

  const handleTwoFactorSubmit = async () => {
    const { data } = await axios.post('/submitCode', {
      code,
      hash: phoneHash,
      phoneNumber,
    });
    if (data.loggedIn) {
      localStorage.setItem('auth', data.auth);
      setAuthenticated(true);
    } else {
      // TODO: handle error
    }
  };

  const phoneNumberProps = {
    phoneNumber,
    setPhoneNumber,
    handleSubmit: handlePhoneSubmit,
  };

  const twoFactorProps = {
    code,
    setCode,
    phoneNumber,
    setStep,
    handleSubmit: handleTwoFactorSubmit,
  };

  if (step === STEP_PHONE) {
    return <PhoneNumber {...phoneNumberProps} />;
  } else if (step === STEP_2FA) {
    return <TwoFactor {...twoFactorProps} />;
  }
};

export default LoginFlow;
