import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { allUsersRoute } from "../utils/APIRoutes";
import mqtt from 'mqtt';
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";

export default function Chat() {
  const navigate = useNavigate();
  const mqttClientRef = useRef(null); 
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // State for sidebar visibility

  useEffect(() => {
    mqttClientRef.current = mqtt.connect('wss://49d84cd4714d4a25ad97ea906e7a7bb6.s1.eu.hivemq.cloud:8884/mqtt', {
      username: "hivemq.webclient.1714543373014",
      password: "SgX&@1Idt:FCy*E3o92m"
    });

    const publishStatus = (status) => {
      if (currentUser) {
        const topic = `user/status/${currentUser._id}`;
        const message = JSON.stringify({ user: currentUser._id, status });
        mqttClientRef.current.publish(topic, message);
      }
    };

    const handleConnect = () => {
      setMqttConnected(true);
      console.log("Connected to MQTT");
      publishStatus('online');
    };

    const handleDisconnect = () => {
      setMqttConnected(false);
      console.log("Disconnected from MQTT");
      publishStatus('offline');
    };

    mqttClientRef.current.on('connect', handleConnect);
    mqttClientRef.current.on('disconnect', handleDisconnect);
    window.addEventListener('beforeunload', handleDisconnect);

    return () => {
      mqttClientRef.current.off('connect', handleConnect);
      mqttClientRef.current.off('disconnect', handleDisconnect);
      window.removeEventListener('beforeunload', handleDisconnect);
    };
  }, [currentUser, currentChat, mqttClientRef]);

  useEffect(() => {
    const checkUser = async () => {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate("/login");
      } else {
        setCurrentUser(
          await JSON.parse(
            localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
          )
        );
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
          setContacts(data.data);
        } else {
          navigate("/setAvatar"); 
        }
      }
    };
    fetchContacts();
  }, [currentUser, navigate]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    mqttClientRef.current.subscribe(`chat/messages/${chat.id}`);
  };

  const sendMessage = (msgData) => {
    // Your sendMessage logic here
  };

  return (
    <>
      <Container>

        <div className={`container ps-0 pe-0 ${isSidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
          {(
            <Contacts contacts={contacts} currentUser={currentUser} changeChat={handleChatChange} mqttClientRef={mqttClientRef}  isSidebarVisible={isSidebarVisible}
            setIsSidebarVisible={setIsSidebarVisible} />
          )}
          {currentChat === undefined ? (
            <Welcome />
          ) : (
            <ChatContainer
              currentChat={currentChat}
              currentUser={currentUser}
              sendMessage={sendMessage}
              mqttClientRef={mqttClientRef}
            />
          )}
        </div>
      </Container>
    </>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color:#273787;

  .toggle-button {
    margin-bottom: 1rem;
    button {
      padding: 0.5rem 1rem;
      font-size: 1rem;
      cursor: pointer;
    }
  }

  .container {
    height: 95vh;
    width: 95vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 30% 70%;
    transition: grid-template-columns 0.5s ease;

    &.sidebar-hidden {
      grid-template-columns: 5% 95%;
     

    }

    @media screen and (min-width: 720px) and (max-width: 1080px) {
      &.sidebar-visible {
        grid-template-columns: 35% 65%;
      }
      &.sidebar-hidden {
        grid-template-columns: 5% 95%;
       
      }
    }
  }
`;
