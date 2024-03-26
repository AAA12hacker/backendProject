import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null; // if the localfile is empty return null
    // uploading the file in cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded succesfully
    console.log("file is uploaded on the cloudinary", response.url);
    //    fs.unlinkSync(localFilePath);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // we are removing  the file from temporary folder as our file uploading got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
