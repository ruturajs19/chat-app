import { v2 as cloudinary, type ConfigOptions } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.Cloud_Name,
    api_key: process.env.Api_Key,
    api_secret: process.env.Api_Secret,
  } as ConfigOptions );

export default cloudinary;
