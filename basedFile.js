// ==> file uploadImage firestore return image uploaded url*
async function upload(file){
    const date=new Date()
    const storageRef = ref(storage, `images/${date + 'rivers.jpg'}`);
const uploadTask = uploadBytesResumable(storageRef, file);
return new Promise((resolve,reject)=>{
uploadTask.on('state_changed', 
  (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Upload is ' + progress + '% done');
  }, 
  (error) => {
    reject('Something went worng!'+ error.code)
  }, 
  () => {
    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        resolve(downloadURL)
    });
})
  }
);
}
