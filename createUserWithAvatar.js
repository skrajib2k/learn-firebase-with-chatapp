// login page
const [loading,setLoading]=useState(false)
// ==========================
setLoading(true)
const { email, password } = formData;
try {
  const res = await createUserWithEmailAndPassword(auth, email, password);
//   upload image here and get imgUrl
    const imgUrl= await upload('input Img here');
  // after user create Sametime a db coll create using custom id
  await setDoc(doc(db, "users", "custom_id->res.user.uid"), {
    username: "",
    email: "",
    avatar:imgUrl,
    id: res.user.id,
    blocks: [],
  });

  await setDoc(doc(db, "userchats", "custom_id->res.user.uid"), {
    chats: [],
  });

  toHaveStyle.success('Account created successfuly! you can login now..')
} catch (err) {
  console.log(err);
  toHaveStyle.error("show error here");
} finally{
    setLoading(false)
}
