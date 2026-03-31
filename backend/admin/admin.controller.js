import { Product } from "../model/product.js";
import {v2} from "cloudinary"
import fs from "fs/promises"
v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
  });
export const addProduct=async(req,res)=>{
    try{
        const {name,totalStocks,price,type}=req.body;
        if(!name || !totalStocks || !price){
            return res.status(400).json({error:"Name, stock, and price are required"})
        }
        // Handle image upload to Cloudinary
        let imageUrl = [];
        if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => {
        return v2.uploader.upload(file.path)
                    .then((result) => {
                        fs.unlink(file.path).catch(err => console.warn('Failed to delete:', file.path));
                        return result.secure_url;
                    });
      });

      imageUrl = await Promise.all(uploadPromises);
    }
        const newProduct=new Product({
            name,
            totalStocks,
            price,
            type: type || "veg",
            image: imageUrl
        })
        const savedProduct=await newProduct.save();
        res.status(201).json(savedProduct)
    }catch(error){
        console.error('Error adding product:',error);
        res.status(500).json({error:"Failed to add product"})
    }   
}

export const getAllProducts=async(req,res)=>{
    try{
        const products=await Product.find({deletedAt:null});
        res.json(products)
    }catch(error){
        console.error('Error fetching products:',error);
        res.status(500).json({error:"Failed to fetch products"})
    }
}

export const getSingleProduct=async(req,res)=>{
    try{
        const {id}=req.params;
        const product=await Product.findById(id);
        if(!product){
            return res.status(404).json({error:"Product not found"})
        }
        res.json(product)
    }catch(error){
        console.error('Error fetching product:',error);
        res.status(500).json({error:"Failed to fetch product"})
    }
}

export const updateProduct=async(req,res)=>{
    try{
        const {id}=req.params;
        const {name,totalStocks,price,type}=req.body;
        
        const updateData={};
        if(name) updateData.name=name;
        if(totalStocks!==undefined) updateData.totalStocks=totalStocks;
        if(price) updateData.price=price;
        if(type) updateData.type=type;
        updateData.updatedAt=new Date();
        
        // Handle new image uploads
        if(req.files && req.files.length>0){
            const uploadPromises=req.files.map((file)=>{
                return v2.uploader.upload(file.path)
                  .then((result)=>{
                    fs.unlink(file.path).catch(err=>console.warn('Failed to delete:',file.path));
                    return result.secure_url;
                  });
            });
            const newImageUrls=await Promise.all(uploadPromises);
            updateData.image=newImageUrls;
        }
        
        const updatedProduct=await Product.findByIdAndUpdate(id,updateData,{new:true});
        if(!updatedProduct){
            return res.status(404).json({error:"Product not found"})
        }
        res.json(updatedProduct)
    }catch(error){
        console.error('Error updating product:',error);
        res.status(500).json({error:"Failed to update product"})
    }
}

export const deleteProduct=async(req,res)=>{
    try{
        const {id}=req.params;
        const deletedProduct=await Product.findByIdAndUpdate(id,{deletedAt:new Date()},{new:true});
        if(!deletedProduct){
            return res.status(404).json({error:"Product not found"})
        }
        res.json({message:"Product deleted successfully",product:deletedProduct})
    }catch(error){
        console.error('Error deleting product:',error);
        res.status(500).json({error:"Failed to delete product"})
    }
}