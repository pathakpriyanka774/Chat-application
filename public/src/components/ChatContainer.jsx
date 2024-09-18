import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { sendMessageRoute, recieveMessageRoute, deleteMessageRoute ,updateMessageRoute} from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, currentUser, sendMessage, mqttClientRef }) {
  const [messages, setMessages] = useState([]);
  console.log("Messages :",messages);
  const [arrivalMessage, setArrivalMessage] = useState(null); 
  const [onlineStatus, setOnlineStatus] = useState({userId:'',status:"offline"});
  const scrollRef = useRef();
  const token = localStorage.getItem('token');
  console.log("token :",token);
  useEffect(() => {
    const fetchMessages = async () => {
      const data = JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );
      //const token = localStorage.getItem('token');
      console.log("token :",token);
      console.log(data);
      const response = await axios.post(
        recieveMessageRoute,
        {
          from: data._id,
          to: currentChat._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
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
    const publishStatus = (status) => {
      const topic = `user/status/${currentUser._id}`;
      const message = JSON.stringify({ user: currentUser._id, status });
      mqttClientRef.current.publish(topic, message, { retain: true });
    };
  
    const handleConnect = () => {
      publishStatus('online');
    };
  
    const handleDisconnect = () => {
      console.log("Disconnects");
      publishStatus('offline');
    };
  
    mqttClientRef.current.on('connect', handleConnect);
    mqttClientRef.current.on('disconnect', handleDisconnect);
    window.addEventListener('beforeunload', handleDisconnect);
  
    return () => {
      //mqttClientRef.current.off('connect', handleConnect);
      //mqttClientRef.current.off('disconnect', handleDisconnect);
      window.removeEventListener('beforeunload', handleDisconnect);
    };
  }, [currentUser]);

  useEffect(() => {
    const handleStatusMessage = (topic, message) => {
      const { user, status } = JSON.parse(message.toString());
      if (topic === `user/status/${currentChat._id}`) {
        console.log("USER STATUS: ",user,status);
        setOnlineStatus({userId:user,status:status});
      }
    };
  
    mqttClientRef.current.subscribe(`user/status/${currentChat._id}`, (err) => {
      if (err) {
        console.error('Subscription error:', err);
      }
    });
  
    mqttClientRef.current.on('message', handleStatusMessage);
  
    return () => {
      mqttClientRef.current.off('message', handleStatusMessage);
    };
  }, [currentChat._id,mqttClientRef]);
  
  

  const handleSendMsg = async (msg) => {
    const data = JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    console.log(data._id);
    axios.post(sendMessageRoute, {
      from: data._id,
      to: currentChat._id,
      message: msg,
    },
    {headers: {
      Authorization: `Bearer ${token}`,
    }});
    sendMessage({ to:currentChat._id,
      from: data._id,
      msg,});
    
  const messageString = JSON.stringify({ to: currentChat._id, from: data._id, msg });
    
  publishMessage(`chat/messages/${currentChat._id}`, messageString);
      const newComingMessage = {  fromSelf: true, message: msg};
       setArrivalMessage(newComingMessage);
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
      if (topic.startsWith('chat/messages/') && parsedMessage.to === currentUser._id && parsedMessage.from === currentChat._id) {
        const newMessage = {fromSelf: false, message: parsedMessage.msg };
        setArrivalMessage(newMessage);
      }
    };

    mqttClientRef.current.on('message', messageHandler);

    return () => {
      mqttClientRef.current.off('message', messageHandler);
    };
  }, [currentChat, currentUser._id]);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDeleteChat = async () => {
    const data = JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
    try {
      await axios.delete(deleteMessageRoute, {
        data: {
          from: data._id,
          to: currentChat._id,
        },
        // headers: {
        //   Authorization: `Bearer ${localStorage.getItem('token')}`, // Assuming you store the JWT token in localStorage
        // },
        
          headers: {
            Authorization: `Bearer ${token}`,
          },
        
      });
      setMessages([]); // Clear messages in state after deletion
      console.log("Chat history deleted successfully.");
    } catch (error) {
      console.error("Error deleting chat history:", error);
    }
  };

  const editMessage = async (id) => {
    const newMessage = prompt('Enter the new message:');
    console.log(id,newMessage);
    if (newMessage) {
      
      try {
        const response = await axios.put(updateMessageRoute, {
          id,
          from:currentUser._id,
          to:currentChat._id,
          message: newMessage,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.status === 200) {
          const updatedMessage = response.data;
          console.log("updated message :",updatedMessage.updatedMessage);
          setMessages(messages.map(msg => msg.id === id ? { ...msg, message: updatedMessage.updatedMessage.message.text } : msg));
          
        } else {
          console.error('Failed to update the message');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    
    }
  };

  

  return (
    <Container>
      <div className="chat-header mt-2">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username mt-3">
            <h3>{currentChat.username}</h3>
            <span className={`status ${onlineStatus.status}`}>{onlineStatus.userId==currentChat._id?onlineStatus.status:''}</span>
          </div>
        </div>
        <div className="header-buttons">
          <button className="delete-chat" onClick={handleDeleteChat}>Delete Chat</button>
          <Logout mqttClientRef={mqttClientRef} currentUser={currentUser} />
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message,index) => {
          console.log(message.id);
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <div
                className={`message ${
                  message.fromSelf ? "sended" : "recieved"
                }`}
              >
               <div className="content">
      <div className="message-content">
        <p>{message.message}</p>
        {message.fromSelf==true?
         <FontAwesomeIcon className="editoption" icon={faEdit} onClick={() => editMessage(message.id)} />:""}
      </div>
    </div>
              </div>
            </div>
          );
        })}
      </div>
      <ChatInput handleSendMsg={handleSendMsg}  />
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
          padding-bottom:10px;
          &.online {
            color: green;
          }
          &.offline {
            color: red;
          }
        }
      }
    }
    .header-buttons {
      display: flex;
      align-items: center;
      gap: 1rem;
      .delete-chat {
        background-color: #ff0000;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        &:hover {
          background-color: #cc0000;
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
        max-width: 50%;
        overflow-wrap: break-word;
        padding-bottom: 0.01rem;
        padding-top:0.5rem;
        padding-right:1rem;
        padding-left:1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    /* Hide the edit icon by default */
    .message-content .editoption {
      visibility: hidden;
      opacity: 0;
      transition: visibility 0s, opacity 0.2s linear;
    }
    
    /* Show the edit icon on hover */
    .message-content:hover .editoption {
      visibility: visible;
      opacity: 1;
    }
    
    /* Style adjustments (optional) */
    .message-content {
      display: flex;
      align-items: center;
    }
    
    .message-content p {
      margin-right: 8px;
    }
    
    .editoption {
      cursor: pointer;
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
