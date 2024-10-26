const { onSnapshot, doc, query, collection, setDoc, serverTimestamp, updateDoc, arrayUnion } = require("firebase/firestore");
const { useEffect } = require("react");

// Login page 
const [loading,setLoading]=useState(false)
// ==============
const handleLogin=async(e)=>{
    e.preventDefault();
    setLoading(true)
    // form data get ==> email&password 
    try {
        await signInWithEmailAndPassword(auth, email, password)
        // .then((userCredential) => { //if need
        //     // Signed in 
        //     const user = userCredential.user;
        //     // ...
        //   }) 
    } catch (error) {
        toast.error(error?.message)
    }
}


// App js page // Login in Status RootLayout
// ========================
const {currentUser,isLoading,feachUserInfo} =useUserStore()
useEffect(()=>{
    const unSub=onAuthStateChanged(auth, (user)=>{
        // console.log(user) log user info
        feachUserInfo(user.uid)
    })

    return ()=>{
        unSub();
    }
},[feachUserInfo])

if(isLoading) return <div>Loading</div>


// =======Store Management===================
const useUserStore = create((set) => ({
    currentUser: null,
    isLoading:true,
    feachUserInfo:async(uid)=>{
        if(!uid) return set({currentUser:null,isLoading:false})

            try {
            const docRef=doc(db,'users','customId for search==> uid')
            const docSnap = await getDoc(docRef)

            if(docSnap.exists()){
                set({currentUser:docSnap.data(),isLoading:false})
            }else{
                set({currentUser:null,isLoading:false})
            }


            } catch (error) {
                console.log(error)
                return set({currentUser:null,isLoading:false})
            }
    }
  }))


const useChatStore = create((set) => ({
    chatId: null,
    user:null,
    isCurrentUserBlocked:false,
    isReceiverBlocked:false,
    isLoading:true,

    changeChat:async(chatId,user)=>{
        const currentUser=useUserStore.getState().currentUser;

        // CHECK IF CURRENT USER IS BLOCKED 
        if(user.blocked.includes(currentUser.id)){
            return set({
                chatId,
                user:null,
                isCurrentUserBlocked:true,
                isReceiverBlocked:false,
            })
        }
        // CHECK IF RECEIVER USER IS BLOCKED 
        else if(currentUser.blocked.includes(user.id)){
            return set({
                chatId,
                user:user,
                isCurrentUserBlocked:false,
                isReceiverBlocked:true,
            })
        }else{

            return set({
                chatId,
                user,
                isCurrentUserBlocked:false,
                isReceiverBlocked:false,
            })
        }

    },
    changeBlock:()=>{
        set(state=>({...state,isReceiverBlocked:!state.isReceiverBlocked}))
    }
       
  }))

  // ========Store end================


//Firebase Fetching Real-time Data 
// ChatList page 
// ========================
const ChatList=()=>{
    const [chats, setChats]=useState([])
    const {currentUser}=useUserStore()
    useEffect(()=>{
        // fetach realtime a collectoin data
        // const unSub=onSnapshot(doc(db,'userchats','custom id=>currentUser.id'),(doc)=>{
        //     setChats(doc.data())
        // })

        const unSub=onSnapshot(doc(db,'userchats',currentUser.id),async(res)=>{
                const items = res.data.chats;
                 
                const promises = items.map(async(item)=>{
                    const userDocRef =doc(db,'users',item.reciverId);
                    const userDocSnap=await getDoc(userDocRef)

                    const user = userDocSnap.data()
                    return {...item,user}
                })
                const chatData=await Promise.all(promises)
                setChats(chatData.sort((a,b)=>b.updateAt-a.updateAt))
            })




    return ()=> {
        unSub()
    }
    },[currentUser.id])

}


// Search a User from Firebase Firestore
// adduser page 
const handleSearch=async(e,username)=>{
    e.preventDefault()
    try {
        const userRef=collectoin(db,'users')
        const q = query(userRef,where("username","==",usermane))

        const querySnapShot=await getDoc(q)
        if(!querySnapShot.empty()){
            setUser(querySnapShot.docs[0].data())
        }
        

    } catch (error) {
        console.log(error)
    }
}

// create new chat 
// add user page 
const handleAdd=async()=>{
    const chatRef=collection(db,'chats')
    const userChatRef=collection(db,'userchats')
    try {
        const newChatRef=doc(chatRef)
        await setDoc(newChatRef,{
            cerateAt:serverTimestamp(),
            message:[]
        })

        await updateDoc(doc(userChatRef,user.id),{
            chats:arrayUnion({
                chatId:newChatRef.id,
                lastMessage:'',
                reciverId:currentUser.id,
                updateAt:serverTimestamp()
            })//push any items inside array
        })

        await updateDoc(doc(userChatRef,currentUser.id),{
            chats:arrayUnion({
                chatId:newChatRef.id,
                lastMessage:'',
                reciverId:user.id,
                updateAt:serverTimestamp()
            })//push any items inside array
        })

        console.log(newChatRef.id)
    } catch (error) {
        console.log(error)
    }
}

// chats page
//  get Realtime chat data for on click
// ====================
const [chat,setChat]=useState([])
const {chatId}=useChatStore()
useEffect(()=>{
    const unSub=onSnapshot(
        doc(db,'chats',chatId),//"chat id finding"
        (res)=>{
            setChat(res.data)
        }
    )
    return ()=>{
        unSub()
    }
},[chatId])


// chatList Page
// const {cgangeChat,chatId}=useChatStore()
const handleUserListToChatSelect=(chat)=>{
    cgangeChat(chat.chatId,chat.user)
}



const handleMessageSend=async()=>{
  if(text==="")return;
  try {
    const userIds= [currentUser.id,user.id]
    userIds.forEach(async(id)=>{

 
    
    await updateDoc(doc(db,'chats',{
      messages:arrayUnion({
        senderId:currentUser.id,
        text,
        createdAt: new Date()
      })
    }))

    // 
    const userChatsRef = doc(db,"userchats",id);
    const userChatSnapShort = await getDoc(userChatsRef)

    if(userChatSnapShort.exists()){
      const userChatsData = userChatSnapShort.data;
      const chatIndex = userChatsData.chats.findIndex((c)=>c.chatId===chatId)

      userChatsData.chats[chatIndex].lastMessage=text;
      userChatsData.chats[chatIndex].isSeen=id===currentUser.id?true:false;
      userChatsData.chats[chatIndex].updatedAt=Date.now();

      await updateDoc(userChatsRef,{
        chats:userChatsData.chats,
      })
    }
  })
  } catch (error) {
    console.log(error);
  }
}
