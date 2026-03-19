import * as ImagePicker from "expo-image-picker";

const CLOUDINARY_CLOUD_NAME = "dck4eemqk";
const CLOUDINARY_UPLOAD_PRESET = "driver-docs";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const pickImageFromLibrary = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permission to access media library was denied");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });
  if (!result.canceled && result.assets.length > 0) {
    return result.assets[0].uri;
  }
  return null;
};

export const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permission to access camera was denied");
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.8,
  });
  if (!result.canceled && result.assets.length > 0) {
    return result.assets[0].uri;
  }
  return null;
};

export const uploadImageToCloudinary = async (uri) => {
  const formData = new FormData();

  // Get the filename and type from the URI
  const filename = uri.split("/").pop();
  const ext = filename.split(".").pop().toLowerCase();
  const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

  formData.append("file", {
    uri,
    name: filename,
    type: mimeType,
  });
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Cloudinary upload failed");
  }

  const data = await response.json();
  return data.secure_url; // The public HTTPS URL of the uploaded image
};

// Drop-in replacement for the old Firebase Storage function
export const uploadDriverDocument = async (uid, uri, documentType) => {
  return await uploadImageToCloudinary(uri);
};

// Keep backward compatibility alias
export const uploadImageToFirebase = uploadImageToCloudinary;
