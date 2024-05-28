import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, currentUser, sendMessage, mqttClientRef }) {
  const [messages, setMessages] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null); 
  const [onlineStatus, setOnlineStatus] = useState("offline");
  const scrollRef = useRef();

  useEffect(() => {
    const fetchMessages = async () => {
      const data = JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );
      const response = await axios.post(recieveMessageRoute, {
        from: data._id,
        to: currentChat._id,
      });
      setMessages(response.data);
    };
    
    fetchMessages();
  }, [currentChat]);

  const publishMessage = (topic, msg) => {
    mqttClientRef.current.publish(topic, msg, (err) => {
      if (err) {
        console.error('Error publishing message:', err);
      } else {
        console.log('Message published successfully at', topic);
      }
    });
  };

  useEffect(() => {
    const handleConnect = () => {
      const statusTopic = `user/status/${currentUser._id}`;
      mqttClientRef.current.subscribe(statusTopic, (err) => {
        if (err) {
          console.error('Subscription error:', err);
        } else {
          console.log('Subscribed to topic:', statusTopic);
          publishMessage(statusTopic, JSON.stringify({user:currentUser, status: 'online' }));
        }
      });
     // mqttClientRef.current.subscribe(`user/status/${currentChat._id}`);
    };

    const handleDisconnect = () => {
      publishMessage(`user/status/${currentUser._id}`, JSON.stringify({ status: 'offline' }));
    };

    mqttClientRef.current.on('connect', handleConnect);
    mqttClientRef.current.on('disconnect', handleDisconnect);
    window.addEventListener('beforeunload', handleDisconnect);

    return () => {
      mqttClientRef.current.off('connect', handleConnect);
      mqttClientRef.current.off('disconnect', handleDisconnect);
      window.removeEventListener('beforeunload', handleDisconnect);
    };
  }, [currentChat, currentUser._id, mqttClientRef]);

  const handleSendMsg = async (msg) => {
    const data = JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    axios.post(sendMessageRoute, {
      from: data._id,
      to: currentChat._id,
      message: msg,
    });
    sendMessage({ to: currentChat._id, from: data._id, msg });
    const messageString = JSON.stringify({ to: currentChat._id, from: data._id, msg });
    publishMessage(`chat/messages/${currentChat._id}`, messageString);
    const newComingMessage = { fromSelf: true, message: msg };
    setMessages((prev) => [...prev, newComingMessage]);
  };

  useEffect(() => {
    const topic = `chat/messages/${currentUser._id}`;
    mqttClientRef.current.subscribe(topic, (err) => {
      if (err) {
        console.error('Subscription error:', err);
      } else {
        console.log('Subscribed to topic:', topic);
      }
    });

    const messageHandler = (topic, message) => {
      const parsedMessage = JSON.parse(message.toString());
      console.log('parsedMessage :',parsedMessage);
      if (topic.startsWith("chat/messages/")) {
        if (parsedMessage.to === currentUser._id && parsedMessage.from === currentChat._id) {
          const newMessage = { fromSelf: false, message: parsedMessage.msg };
          setArrivalMessage(newMessage);
        }
      } 
       if (topic.startsWith("user/status/")) {
        console.log("Current Chat ID :",currentUser._id);
        console.log("parsed messages user :",parsedMessage.user);

        if(currentChat._id==parsedMessage.user._id){
          console.log("YESS!!!");
        
        if (parsedMessage.status && parsedMessage.status !== onlineStatus) {
          setOnlineStatus(parsedMessage.status);
        }
      }
      }
    };

    mqttClientRef.current.on('message', messageHandler);
    mqttClientRef.current.on('error', (error) => {
      console.error(`MQTT error: ${error}`);
    });

    return () => {
      mqttClientRef.current.off('message', messageHandler);
    };
  }, [currentChat, currentUser._id, mqttClientRef, onlineStatus]);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
            <span className={`status ${onlineStatus}`}>{onlineStatus}</span>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages">
        {messages.map((message) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <div
                className={`message ${
                  message.fromSelf ? "sended" : "recieved"
                }`}
              >
                <div className="content ">
                  <p>{message.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} />
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        display: flex;
        flex-direction: column;
        h3 {
          color: white;
        }
        .status {
          font-size: 0.8rem;
          color: gray;
          &.online {
            color: green;
          }
          &.offline {
            color: red;
          }
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }
`;
