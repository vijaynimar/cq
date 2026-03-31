import { User } from "../model/user.js"
import { v2 } from "cloudinary"
import fs from "fs/promises"
import "dotenv/config"
v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const getUserById=async(req,res)=>{
    try{
        const userId=req.params.id;
        const user=await User.findById(userId).select("-password");
        if(!user){
            return res.status(404).json({error:"User not found"})
        }
        res.json(user)
    }
    catch(error){
        res.status(500).json({error:"Failed to fetch user"})
    }   
}


// update current user profile
export const updateUserProfile=async(req,res)=>{
    try{
        const userId=req.user?.userId;
        if(!userId){
            return res.status(401).json({error:"Unauthorized"})
        }

        // Protect sensitive fields
        if(req.body.role || req.body.createdAt || req.body.deletedAt || req.body.email || req.body.phone){
            return res.status(403).json({error:"Cannot modify protected fields"})
        }

        const {firstName,lastName,walletMoney}=req.body;
        const updateData={};

        if(firstName!==undefined && firstName!==null) updateData.firstName=firstName;
        if(lastName!==undefined && lastName!==null) updateData.lastName=lastName;
        if(walletMoney!==undefined && walletMoney!==null) updateData.walletMoney=walletMoney;

        // Handle image upload to Cloudinary
        if(req.file){
            try{
                const result=await v2.uploader.upload(req.file.path);
                console.log('Cloudinary upload result:',result.secure_url);
                updateData.image=result.secure_url;
                
                // Delete local file after successful upload
                try{
                    await fs.unlink(req.file.path);
                    console.log('Local file deleted:',req.file.path);
                }catch(deleteErr){
                    console.warn('Failed to delete local file:',deleteErr.message);
                }
            }catch(err){
                console.error('Cloudinary upload error:',err);
                return res.status(500).json({error:"Failed to upload image"})
            }
        }

        const updatedUser=await User.findByIdAndUpdate(userId,updateData,{new:true}).select("-password");
        if(!updatedUser){
            return res.status(404).json({error:"User not found"})
        }
        res.json(updatedUser)
    }
    catch(error){
        console.error('Error updating profile:',error);
        res.status(500).json({error:"Failed to update user profile"})
    }
}

export const getMe=async(req,res)=>{
    try{
        const userId=req.user.userId;
        const user=await User.findById(userId).select("-password");
        if(!user){
            return res.status(404).json({error:"User not found"})
        }
        res.json(user)
    }
    catch(error){
        res.status(500).json({error:"Failed to fetch user"})
    }
}
