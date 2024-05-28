import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { allUsersRoute  } from "../utils/APIRoutes";
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
 
 
  mqttClientRef.current = mqtt.connect('wss://49d84cd4714d4a25ad97ea906e7a7bb6.s1.eu.hivemq.cloud:8884/mqtt', {
    username: "hivemq.webclient.1714543373014",
    password: "SgX&@1Idt:FCy*E3o92m"
});
// mqttClientRef.current.on('connect', () => {
//   mqttClientRef.current.subscribe(`chat/messages/${currentUser._id}`);
 
// });
mqttClientRef.current.on('error', (err) => {
  console.error('MQTT Error:', err);
});



  useEffect(async () => {
   // console.log("process.env.REACT_APP_LOCALHOST_KEY",process.env.REACT_APP_LOCALHOST_KEY);
    if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/login");
    } else {
      setCurrentUser(
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        )
      );
    }
  }, []);

  // useEffect(() => {
    
  //   mqttClientRef.current.on('message', (topic, message) => {
  //     const currentChat = [...contacts, message];
  //     console.log("currentChat",currentChat);
  //     setCurrentChat(currentChat);
  //   });

   
  // }, [contacts]);

  const sendMessage = (msgData) => {
   
   // console.log("msgData", msgData); 
  };
  
  useEffect(async () => {
    if (currentUser) {
      if (currentUser.isAvatarImageSet) {
        const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
        setContacts(data.data);
      } else {
        navigate("/setAvatar"); 
      }
    }
  }, [currentUser]);
  
  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    mqttClientRef.current.subscribe(`chat/messages/${chat.id}`);
   //mqttClientRef.current.subscribe(`chat/messages/${currentUser._id}`);

  };
  


  
  return (
    <>
      <Container>
        <div className="container">
       
          
          <Contacts contacts={contacts} changeChat={handleChatChange} />
          {currentChat === undefined ? (
            <>
           
            <Welcome />
            </>
          ) : (<>
          
            <ChatContainer currentChat={currentChat} currentUser={currentUser} sendMessage={sendMessage} mqttClientRef={mqttClientRef}  />
            </>
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
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;
