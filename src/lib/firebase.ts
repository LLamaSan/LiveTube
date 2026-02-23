import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

export async function uploadImageAndGetUrl(
  data: Uint8Array, 
  path: string
): Promise<string> {
  const storageRef = ref(storage, path);
  
  const metadata = {
    contentType: 'image/png',
  };

  const snapshot = await uploadBytes(storageRef, data, metadata);
  return await getDownloadURL(snapshot.ref);
}