import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from 'axios'; 
import Logo from "../assets/logo.svg";
import { getUserSearchRoute } from "../utils/APIRoutes";
import Logout from "./Logout";
export default function Contacts({ contacts, changeChat }) {
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [currentUserImage, setCurrentUserImage] = useState(undefined);
  const [currentSelected, setCurrentSelected] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [mycontacts, setmycontacts] = useState([]);
 
  let array2=[];
  useEffect(async () => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    setCurrentUserName(data.username);
    setCurrentUserImage(data.avatarImage);
  }, []);

  useEffect(() => {
    // Function to fetch search results from the server
    const fetchSearchResults = async () => {
      try {
        const response = await axios.get(`${getUserSearchRoute}?searchQuery=${searchQuery}`);
        //console.log("response.data",response.data);
        filterdata(response.data);
        setSearchResults(response.data);
      
       }
      catch (error) {
        console.error('Error fetching search results:', error);
      }
    };
    
    // Call the fetchSearchResults function when searchQuery changes
    fetchSearchResults();
  }, [searchQuery]);

 const filterdata=(contactarray,start=0)=>{
  //console.log("SearchResults",contactarray);
  if(contactarray.length>4){
    array2=contactarray.filter((contact,index)=>{
  if(index>=start && index<=start+3){
  return contact;
}   })

  setmycontacts(array2);
}
else{
setmycontacts(contactarray);
}
 }

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };
  const handleSortasecending=()=>{
  
    const arr1=[...mycontacts].sort((contactA,contactb)=>contactA.username.localeCompare(contactb.username));
    
        setmycontacts(arr1);
          
  }
  const handleSortdescending=()=>{
  
    const arr1=[...mycontacts].sort((contactA,contactb)=>contactb.username.localeCompare(contactA.username));
    
        setmycontacts(arr1);
          
  }
 
  const nextBtn=()=>{
    if(startIndex<searchResults.length-4){
   filterdata(searchResults,startIndex+4);
   setStartIndex(startIndex+4);
    }

  }

  const prevBtn=()=>{
    if(startIndex>=4){
      filterdata(searchResults,startIndex-4);
    setStartIndex(startIndex-4);
    }

  }
  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  return (
    <>
      {currentUserImage && currentUserImage && (
        <Container>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h3>ChitChat</h3>
          </div>
          <div className="contacts">
            <div  className="sortContact row"><div className="col-6" onClick={()=>handleSortasecending(mycontacts)}><h3>Sort ↑</h3>
 </div><div className="col-6" onClick={()=>handleSortdescending(mycontacts)}><h3>Sort ↓</h3>
 </div></div>
            
     <div className="searchdiv">
      <input 
      className={`searchcontact`}
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={handleSearchInputChange}
      />

      
    </div>
        
            {mycontacts.map((contact,index)=>
              (
                <div
                  key={contact._id}
                  className={`contact ${
                    index === currentSelected ? "selected" : ""
                  }`}
                  onClick={() => changeCurrentChat(index, contact)}
                >
                  <div className="avatar">
                    <img
                      src={`data:image/svg+xml;base64,${contact.avatarImage}`}
                      alt=""
                    />
                  </div>
                  <div className="username">
                    <h4>{contact.username}</h4>
                  </div>
                </div>
              )
              

            )}
             <div className="row w-100 mb-2"><div className="col-4"><button className="btn nextbtn btn-primary pt-2 pb-0 ms-2 me-1" onClick={()=>prevBtn()}><h6>Prev</h6></button></div><div className="col-4 "><button className="btn btn-primary nextbtn pt-2 pb-0 ms-5" onClick={()=>nextBtn()}><h6>Next</h6></button></div>
             </div>
          </div>
          
          <div className="current-user ">
            <div className="avatar mt-2 me-2">
              <img
                src={`data:image/svg+xml;base64,${currentUserImage}`}
                alt="avatar"
              />
            </div>
            
            <div className="username row">
             <div className="col-8 mt-3"><h3>{currentUserName}</h3></div><div className="col-4 mt-3"><Logout /></div>
            </div>
            
          </div>
          
        </Container>
      )}
    </>
  );
}
const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #080420;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 2rem;
    }
    h3 {
      color: white;
      text-transform: uppercase;
    }
  }
  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .contact {
      background-color: #ffffff34;
      min-height: 3rem;
      cursor: pointer;
      width: 95%;
      border-radius: 0.2rem;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h4 {
          color: white;
        }
      }
    }
    .selected {
      background-color: #9a86f3;
      
    }
  }

  .searchcontact{
    background-color: #ffffff34;
    min-height: 2rem;
    color:"white";
    width: 95%;
    border-radius: 0.2rem;
    padding: 0.4rem;
    display: flex;
    gap: 1rem;
    align-items: center;
    transition: 0.5s ease-in-out;
  }
   .sortContact{
    h3 {
      color: white;
      text-align:center;
    }
    background-color: #9a86f3;
      min-height: 2rem;
      cursor: pointer;
      width: 95%;
      border-radius: 0.2rem;
   }
  .current-user {
    background-color: #0d0d30;
    display: flex;
    justify-content: center;
    
    gap: 1rem;
    .avatar {
      img {
        height: 3rem;
        max-inline-size: 100%;
      }
    }
    .username {
      h3 {
        color: white;
      }
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;
