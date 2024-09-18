import React from "react";
import { useNavigate } from "react-router-dom";
import { BiPowerOff } from "react-icons/bi";
import styled from "styled-components";
import axios from "axios";
import { logoutRoute } from "../utils/APIRoutes";
export default function Logout( {mqttClientRef,currentUser}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    const publishStatus = (status) => {
      if (currentUser) {
        const topic = `user/status/${currentUser._id}`;
        const message = JSON.stringify({ user: currentUser._id, status });
        mqttClientRef.current.publish(topic, message, { retain: true }, () => {
          mqttClientRef.current.end();
          localStorage.removeItem(process.env.REACT_APP_LOCALHOST_KEY);
          navigate("/login");
        });
      }
    };
    publishStatus('offline');
  };
  return (
    <Button onClick={handleLogout}>
      <BiPowerOff />
    </Button>
  );
}

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: #9a86f3;
  border: none;
  cursor: pointer;
  svg {
    font-size: 1.3rem;
    color: #ebe7ff;
  }
`;
